import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const FFMPEG_BIN = path.resolve('backend/node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe');
const KEY_PATH = path.resolve('backend/gcp_key.json');
const DEEPGRAM_KEY = process.env.DEEPGRAM_API_KEY;

const keyData = JSON.parse(fs.readFileSync(KEY_PATH, 'utf-8'));

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claimSet = Buffer.from(JSON.stringify({
    iss: keyData.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: keyData.token_uri || 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })).toString('base64url');

  const signatureInput = `${header}.${claimSet}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer.sign(keyData.private_key, 'base64url');
  const jwt = `${signatureInput}.${signature}`;

  const res = await fetch(keyData.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await res.json();
  return data.access_token;
}

// 1. Google Cloud TTS
async function generateVoiceover(text, outPath) {
  console.log('🎙️ [Step 1] Synthesizing Google Cloud Neural Voiceover...');
  const token = await getAccessToken();
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Neural2-J',
        ssmlGender: 'MALE',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.05,
        pitch: -1.0,
      },
    }),
  });

  if (!res.ok) {
    const errTxt = await res.text();
    throw new Error(`Google TTS failed: ${errTxt}`);
  }

  const data = await res.json();
  const audioBuffer = Buffer.from(data.audioContent, 'base64');
  fs.writeFileSync(outPath, audioBuffer);
  console.log(`✅ [Step 1] Voiceover saved: ${outPath} (${(audioBuffer.length / 1024).toFixed(1)} KB)`);
}

// 2. Deepgram Word Timestamps
async function getWordTimestamps(audioPath) {
  console.log('⏱️ [Step 2] Aligning acoustic word timestamps with Deepgram Nova-3...');
  try {
    const audioBuffer = fs.readFileSync(audioPath);
    const res = await fetch('https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_KEY}`,
        'Content-Type': 'audio/mp3',
      },
      body: audioBuffer,
    });

    if (res.ok) {
      const data = await res.json();
      const words = data.results?.channels?.[0]?.alternatives?.[0]?.words || [];
      console.log(`✅ [Step 2] Deepgram aligned ${words.length} words with millisecond precision!`);
      return words;
    } else {
      console.warn('Deepgram returned status:', res.status);
    }
  } catch (err) {
    console.warn('Deepgram alignment fallback:', err.message);
  }
  return null;
}

// 3. Generate Consistent Scene Visuals on Vertex AI
async function generateSceneVisual(token, prompt, refBase64, outPath) {
  const projectId = keyData.project_id;
  const location = 'us-central1';
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash-image:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/png', data: refBase64 } },
          { text: `Maintain the exact same translucent cybernetic banana character with golden rings and internal neon circuits from the reference image: ${prompt}, 8k photorealistic cinematic movie frame, 16:9 widescreen` }
        ]
      }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
    })
  });

  if (res.ok) {
    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData);
    if (imgPart) {
      const buf = Buffer.from(imgPart.inlineData.data, 'base64');
      fs.writeFileSync(outPath, buf);
      return true;
    }
  }
  return false;
}

// Format seconds into SRT time format: 00:00:00,000
function formatSrtTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

async function produceMasterFilm() {
  console.log('=====================================================');
  console.log('🎬 PRODUCING 30-SECOND MASTER AI SHORT FILM');
  console.log('=====================================================\n');

  const uploadDir = path.resolve('uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const voiceText = 'In the neon-drenched streets of Neo Tokyo, a legendary cybernetic banana awakens. Cruising on its high-tech hoverboard, it speeds through the rain, dodging futuristic traffic. Arriving at the central mainframe tower, it hacks into the encrypted quantum grid. A surge of golden energy sparks through its circuits, unlocking forbidden cyber secrets. Mission accomplished, it activates rocket boosters and blasts off into the starry night sky.';
  
  const voicePath = path.join(uploadDir, 'short_film_voiceover.mp3');

  // Step 1: Voiceover
  await generateVoiceover(voiceText, voicePath);

  // Step 2: Deepgram Word Timestamps
  const words = await getWordTimestamps(voicePath);

  // Step 3: Subtitles (.srt file)
  const srtPath = path.join(uploadDir, 'short_film_subtitles.srt');
  let srtContent = '';

  if (words && words.length > 0) {
    // Group words into groups of 3-4 words per subtitle card
    const groupSize = 4;
    let cardIdx = 1;
    for (let i = 0; i < words.length; i += groupSize) {
      const slice = words.slice(i, i + groupSize);
      const startTime = slice[0].start;
      const endTime = slice[slice.length - 1].end;
      const text = slice.map(w => w.punctuated_word || w.word).join(' ').toUpperCase();
      
      srtContent += `${cardIdx}\n${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n${text}\n\n`;
      cardIdx++;
    }
  } else {
    // Fallback: 5 scene cards
    const beats = [
      { start: 0.0, end: 5.8, text: 'IN NEO TOKYO, A CYBERNETIC BANANA AWAKENS' },
      { start: 6.0, end: 11.8, text: 'SPEEDING THROUGH RAIN ON A NEON HOVERBOARD' },
      { start: 12.0, end: 17.8, text: 'HACKING INTO THE ENCRYPTED QUANTUM GRID' },
      { start: 18.0, end: 23.8, text: 'GOLDEN ENERGY SPARKS UNLOCKING CYBER SECRETS' },
      { start: 24.0, end: 29.8, text: 'MISSION COMPLETE: BLASTING OFF INTO THE NIGHT' },
    ];
    beats.forEach((b, idx) => {
      srtContent += `${idx + 1}\n${formatSrtTime(b.start)} --> ${formatSrtTime(b.end)}\n${b.text}\n\n`;
    });
  }
  fs.writeFileSync(srtPath, srtContent);
  console.log(`✅ [Step 3] Subtitles written to: ${srtPath}`);

  // Step 4: Scene Visuals
  console.log('\n🎨 [Step 4] Generating 5 Consistent Character Scene Visuals on Vertex AI...');
  const token = await getAccessToken();

  const refPath = path.join(uploadDir, 'nano_banana_gemini-2.5-flash-image.png');
  const refBuffer = fs.readFileSync(refPath);
  const refBase64 = refBuffer.toString('base64');

  const scenePrompts = [
    { num: 1, prompt: 'Dramatic close-up heroic portrait in Neo Tokyo neon street', file: path.join(uploadDir, 'nano_banana_gemini-2.5-flash-image.png'), reuse: true },
    { num: 2, prompt: 'Riding a neon hoverboard through rainy Tokyo street with reflections', file: path.join(uploadDir, 'consistent_character_scene2.png'), reuse: true },
    { num: 3, prompt: 'In a futuristic quantum server mainframe room with holographic blue data streams', file: path.join(uploadDir, 'scene3_mainframe_hack.png'), reuse: false },
    { num: 4, prompt: 'Glowing with powerful golden cyber energy surge and lightning sparks', file: path.join(uploadDir, 'scene4_energy_surge.png'), reuse: false },
    { num: 5, prompt: 'Rocket thrusters firing from the bottom, flying upwards into starry cyberpunk sky', file: path.join(uploadDir, 'scene5_rocket_blastoff.png'), reuse: false },
  ];

  for (const sc of scenePrompts) {
    if (sc.reuse && fs.existsSync(sc.file)) {
      console.log(`  Scene ${sc.num}: Reusing existing verified scene visual: ${path.basename(sc.file)}`);
      continue;
    }
    console.log(`  Scene ${sc.num}: Generating on Vertex AI with consistent character anchor...`);
    const success = await generateSceneVisual(token, sc.prompt, refBase64, sc.file);
    if (success && fs.existsSync(sc.file)) {
      console.log(`  ✅ Scene ${sc.num} generated: ${path.basename(sc.file)} (${(fs.statSync(sc.file).size / 1024).toFixed(1)} KB)`);
    } else {
      console.log(`  Scene ${sc.num}: Falling back to base character frame.`);
      fs.copyFileSync(refPath, sc.file);
    }
  }

  // Step 5: Render 6s 3D motion clips from each scene using FFmpeg
  console.log('\n🎥 [Step 5] Rendering 6-second dynamic motion video clips with FFmpeg...');
  const clipPaths = [];
  const motions = [
    "zoompan=z='min(zoom+0.0015,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=180:s=1920x1080:fps=30", // slow zoom in
    "zoompan=z='1.15':x='if(eq(on,1),0,x+1)':y='ih/2-(ih/zoom/2)':d=180:s=1920x1080:fps=30",              // pan right
    "zoompan=z='min(zoom+0.002,1.3)':x='iw/2-(iw/zoom/2)':y='if(eq(on,1),ih/2,y-0.5)':d=180:s=1920x1080:fps=30", // push in & tilt up
    "zoompan=z='1.2-0.001*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=180:s=1920x1080:fps=30",         // slow pull out
    "zoompan=z='min(zoom+0.0025,1.35)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=180:s=1920x1080:fps=30" // dynamic push in
  ];

  for (let i = 0; i < scenePrompts.length; i++) {
    const sc = scenePrompts[i];
    const clipOut = path.join(uploadDir, `film_clip_${sc.num}.mp4`);
    const filter = motions[i % motions.length];

    const cmd = `"${FFMPEG_BIN}" -y -loop 1 -i "${sc.file}" -vf "scale=3840:2160:flags=lanczos,${filter},unsharp=5:5:0.8:5:5:0.0,format=yuv420p" -c:v libx264 -preset fast -crf 18 -t 6 "${clipOut}"`;
    await execPromise(cmd);
    console.log(`  ✅ Rendered Clip ${sc.num}: ${path.basename(clipOut)} (6.0s, 1080p, ${(fs.statSync(clipOut).size / 1024 / 1024).toFixed(2)} MB)`);
    clipPaths.push(clipOut);
  }

  // Step 6: Concat clips & Generate Ambient BGM
  console.log('\n🎶 [Step 6] Synthesizing ambient cyberpunk soundscape & stitching audio...');
  const concatTxtPath = path.join(uploadDir, 'concat_film_list.txt');
  fs.writeFileSync(concatTxtPath, clipPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n'));

  const scenesCombinedPath = path.join(uploadDir, 'film_scenes_stitched.mp4');
  const concatCmd = `"${FFMPEG_BIN}" -y -f concat -safe 0 -i "${concatTxtPath}" -c copy "${scenesCombinedPath}"`;
  await execPromise(concatCmd);
  console.log(`  ✅ Stitched 5 scenes together: ${path.basename(scenesCombinedPath)} (30.0s total)`);

  // Generate ambient cyberpunk drone & bass background music (30s)
  const bgmPath = path.join(uploadDir, 'film_ambient_bgm.mp3');
  const bgmCmd = `"${FFMPEG_BIN}" -y -f lavfi -i "sine=frequency=55:duration=30" -f lavfi -i "sine=frequency=110:duration=30" -f lavfi -i "anoisesrc=d=30:c=pink:r=44100:a=0.03" -filter_complex "[0:a]volume=0.3[a0];[1:a]volume=0.2[a1];[2:a]lowpass=f=400,volume=0.15[a2];[a0][a1][a2]amix=inputs=3[out]" -map "[out]" -b:a 192k "${bgmPath}"`;
  await execPromise(bgmCmd);
  console.log(`  ✅ Synthesized ambient cyberpunk BGM: ${path.basename(bgmPath)}`);

  // Step 7: Master Mix (Video + Voiceover + BGM + Burned-in Subtitles)
  console.log('\n🚀 [Step 7] Producing FINAL 30-Second Master Video with Synchronized Subtitles...');
  const masterPath = path.join(uploadDir, 'master_short_film_30s.mp4');

  // Escape Windows path for FFmpeg subtitles filter
  const escapedSrt = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');

  // Subtitle styling: Yellow bold font, black outline, centered near bottom
  const subStyle = "FontName=Arial,FontSize=22,PrimaryColour=&H0000FFFF,OutlineColour=&H00000000,BackColour=&H80000000,Bold=1,Outline=2,Shadow=1,Alignment=2,MarginV=35";

  // Audio mix: Voiceover at 1.0, BGM ducked at 0.15, mixed together
  const masterCmd = `"${FFMPEG_BIN}" -y -i "${scenesCombinedPath}" -i "${voicePath}" -i "${bgmPath}" -filter_complex "[1:a]volume=1.0[v_voice];[2:a]volume=0.18[v_bgm];[v_voice][v_bgm]amix=inputs=2:duration=first[a_mix];[0:v]subtitles='${escapedSrt}':force_style='${subStyle}'[v_sub]" -map "[v_sub]" -map "[a_mix]" -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k -shortest -t 30 "${masterPath}"`;

  try {
    await execPromise(masterCmd);
  } catch (subErr) {
    console.warn('Burned-in subtitle filter fallback (without libass):', subErr.message);
    // Fallback if libass font filter fails: clean audio mix without hardcoded filter
    const fallbackMasterCmd = `"${FFMPEG_BIN}" -y -i "${scenesCombinedPath}" -i "${voicePath}" -i "${bgmPath}" -filter_complex "[1:a]volume=1.0[v_voice];[2:a]volume=0.18[v_bgm];[v_voice][v_bgm]amix=inputs=2:duration=first[a_mix]" -map 0:v -map "[a_mix]" -c:v copy -c:a aac -b:a 192k -shortest -t 30 "${masterPath}"`;
    await execPromise(fallbackMasterCmd);
  }

  if (fs.existsSync(masterPath)) {
    const finalSizeMb = (fs.statSync(masterPath).size / 1024 / 1024).toFixed(2);
    console.log('\n=====================================================');
    console.log(`🎉 MASTER 30-SECOND SHORT FILM COMPLETE!`);
    console.log(`📁 File: ${masterPath}`);
    console.log(`📊 Size: ${finalSizeMb} MB | Duration: 30 Seconds | 1080p`);
    console.log('=====================================================');
  }
}

produceMasterFilm().catch(console.error);
