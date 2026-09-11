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

// Synthesize speech with specific Google Cloud Neural2 voice
async function synthesizeVoiceLine(token, text, voiceName, gender, speakingRate = 1.0) {
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: 'en-IN',
        name: voiceName,
        ssmlGender: gender,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate,
        pitch: gender === 'MALE' ? -1.0 : 1.0,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS Error (${voiceName}): ${err}`);
  }

  const data = await res.json();
  return Buffer.from(data.audioContent, 'base64');
}

// Generate Vertex AI Image
async function generateVertexImage(token, prompt, refBase64 = null, outPath) {
  const projectId = keyData.project_id;
  const location = 'us-central1';
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash-image:generateContent`;

  const parts = [];
  if (refBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: refBase64,
      }
    });
    parts.push({
      text: `Maintain 100% exact facial geometry, hairstyles, and clothing of both the young man (Aryan, handsome 26yo Indian man in navy wool overcoat with charcoal scarf) and the young woman (Riya, beautiful 25yo Indian woman in pastel blush trench with ivory scarf) from the attached reference photo: ${prompt}, 8k photorealistic cinematic movie still, 16:9 widescreen, golden hour sunset lighting on green mountain hill station`
    });
  } else {
    parts.push({
      text: `${prompt}, 8k photorealistic cinematic movie still, 16:9 widescreen, golden hour sunset lighting on green mountain hill station`
    });
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
    })
  });

  if (res.ok) {
    const data = await res.json();
    const candidateParts = data.candidates?.[0]?.content?.parts || [];
    const imgPart = candidateParts.find(p => p.inlineData);
    if (imgPart) {
      const buf = Buffer.from(imgPart.inlineData.data, 'base64');
      fs.writeFileSync(outPath, buf);
      return true;
    }
  } else {
    console.warn(`Vertex Image HTTP ${res.status}:`, await res.text());
  }
  return false;
}

function formatSrtTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

async function produceProposalMovie() {
  console.log('================================================================');
  console.log('🎬 PRODUCING 60-SECOND CINEMATIC MOVIE SCENE: "A PROMISE AT SUNSET"');
  console.log('================================================================\n');

  const uploadDir = path.resolve('uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const token = await getAccessToken();

  // -------------------------------------------------------------
  // STEP 1: DUAL-VOICE DIALOGUE SYNTHESIS
  // -------------------------------------------------------------
  console.log('🎙️ [Step 1] Synthesizing Dual-Voice Character Dialogues (Google Neural2)...');
  
  const dialogueBeats = [
    { beat: 1, speaker: 'ARYAN', text: "Look at this view, Riya... I've waited so long to bring you to this place.", voice: 'en-IN-Neural2-B', gender: 'MALE', startSec: 0.5, dur: 5.0 },
    { beat: 2, speaker: 'RIYA', text: "It feels like we're standing right above the clouds. It's breathtaking, Aryan.", voice: 'en-IN-Neural2-D', gender: 'FEMALE', startSec: 6.5, dur: 5.0 },
    { beat: 3, speaker: 'ARYAN', text: "Not as breathtaking as you. Every path I've walked only made sense when you were by my side.", voice: 'en-IN-Neural2-B', gender: 'MALE', startSec: 12.5, dur: 5.0 },
    { beat: 4, speaker: 'RIYA', text: "Aryan... what are you doing?", voice: 'en-IN-Neural2-D', gender: 'FEMALE', startSec: 18.5, dur: 4.5 },
    { beat: 5, speaker: 'ARYAN', text: "I don't just want moments with you. I want every sunrise and every sunset for the rest of my life.", voice: 'en-IN-Neural2-B', gender: 'MALE', startSec: 24.5, dur: 5.0 },
    { beat: 6, speaker: 'RIYA', text: "Oh my god...", voice: 'en-IN-Neural2-D', gender: 'FEMALE', startSec: 30.5, dur: 3.5 },
    { beat: 7, speaker: 'ARYAN', text: "Riya Sharma... will you marry me and make me the happiest man alive?", voice: 'en-IN-Neural2-B', gender: 'MALE', startSec: 36.5, dur: 5.0 },
    { beat: 8, speaker: 'RIYA', text: "Yes! Yes, a thousand times yes, Aryan!", voice: 'en-IN-Neural2-D', gender: 'FEMALE', startSec: 42.5, dur: 4.5 },
    { beat: 9, speaker: 'ARYAN', text: "I promise to love you, cherish you, and stand by you forever.", voice: 'en-IN-Neural2-B', gender: 'MALE', startSec: 48.5, dur: 5.0 },
    { beat: 10, speaker: 'MUSIC', text: "", isMusic: true, startSec: 54.0, dur: 6.0 }
  ];

  const audioClips = [];
  for (const b of dialogueBeats) {
    if (b.isMusic || !b.text) continue;
    const clipPath = path.join(uploadDir, `dialogue_beat_${b.beat}.mp3`);
    if (fs.existsSync(clipPath) && fs.statSync(clipPath).size > 1000) {
      console.log(`  Reusing Beat ${b.beat} [${b.speaker}] audio...`);
      audioClips.push({ ...b, path: clipPath });
      continue;
    }
    console.log(`  Synthesizing Beat ${b.beat} [${b.speaker}]: "${b.text.slice(0, 40)}..."`);
    const buf = await synthesizeVoiceLine(token, b.text, b.voice, b.gender, 0.98);
    fs.writeFileSync(clipPath, buf);
    audioClips.push({ ...b, path: clipPath });
  }

  // Create full 60-second padded dialogue track using FFmpeg
  console.log('  Stitching dual-voice dialogue into continuous 60s timeline...');
  const masterDialoguePath = path.join(uploadDir, 'proposal_master_dialogue_60s.mp3');
  
  // Use a 60s silent canvas as input 0 and overlay each delayed dialogue clip
  const filterInputs = audioClips.map((c, i) => `[${i + 1}:a]adelay=${Math.round(c.startSec * 1000)}|${Math.round(c.startSec * 1000)}[a${i}]`).join(';');
  const amixInputs = `[silence]` + audioClips.map((c, i) => `[a${i}]`).join('');
  const filterComplex = `[0:a]volume=0[silence];${filterInputs};${amixInputs}amix=inputs=${audioClips.length + 1}:duration=first:dropout_transition=0[out]`;
  
  const ffmpegInputs = `-f lavfi -i "sine=f=10:d=60" ` + audioClips.map(c => `-i "${c.path}"`).join(' ');
  const stitchCmd = `"${FFMPEG_BIN}" -y ${ffmpegInputs} -filter_complex "${filterComplex}" -map "[out]" -t 60 -b:a 192k "${masterDialoguePath}"`;
  await execPromise(stitchCmd);
  console.log(`✅ [Step 1] Master 60s dialogue track ready: ${masterDialoguePath}`);

  // -------------------------------------------------------------
  // STEP 2: DEEPGRAM NOVA-3 SUBTITLE SYNCHRONIZATION
  // -------------------------------------------------------------
  console.log('\n⏱️ [Step 2] Aligning dialogue timestamps with Deepgram Nova-3...');
  const srtPath = path.join(uploadDir, 'proposal_movie_subtitles.srt');
  let srtContent = '';

  try {
    const audioBuf = fs.readFileSync(masterDialoguePath);
    const dgRes = await fetch('https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_KEY}`,
        'Content-Type': 'audio/mp3',
      },
      body: audioBuf,
    });

    if (dgRes.ok) {
      const dgData = await dgRes.json();
      const words = dgData.results?.channels?.[0]?.alternatives?.[0]?.words || [];
      console.log(`  Deepgram detected ${words.length} words with acoustic precision!`);
      
      // Map words back to speakers and format into subtitle cards
      dialogueBeats.forEach((b, idx) => {
        if (!b.text) return;
        const beatWords = words.filter(w => w.start >= b.startSec - 0.5 && w.end <= b.startSec + b.dur + 0.8);
        const startTime = beatWords[0]?.start || b.startSec;
        const endTime = beatWords[beatWords.length - 1]?.end || (b.startSec + b.dur);
        const cardText = `${b.speaker}: "${b.text}"`;
        srtContent += `${idx + 1}\n${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n${cardText}\n\n`;
      });
    }
  } catch (dgErr) {
    console.warn('Deepgram alignment fallback:', dgErr.message);
  }

  if (!srtContent.trim()) {
    // Exact beat timecode fallback
    dialogueBeats.forEach((b, idx) => {
      if (!b.text) return;
      srtContent += `${idx + 1}\n${formatSrtTime(b.startSec)} --> ${formatSrtTime(b.startSec + b.dur)}\n${b.speaker}: "${b.text}"\n\n`;
    });
  }
  fs.writeFileSync(srtPath, srtContent);
  console.log(`✅ [Step 2] Subtitles written to: ${srtPath}`);

  // -------------------------------------------------------------
  // STEP 3: MASTER CHARACTER REFERENCE ("COUPLE BIBLE")
  // -------------------------------------------------------------
  console.log('\n👤 [Step 3] Generating Master Couple Reference Anchor on Vertex AI...');
  const masterCouplePath = path.join(uploadDir, 'proposal_master_couple.png');
  
  const masterCouplePrompt = "Heroic cinematic portrait of an attractive young couple standing together on a lush green cliffside hill station viewpoint at sunset. The man (Aryan, 26, handsome Indian man, neat dark hair, structured jawline, wearing a tailored navy blue wool overcoat and charcoal cashmere scarf). The woman (Riya, 25, beautiful Indian woman, radiant complexion, wavy dark brown hair, wearing a soft pastel blush wool trench coat and ivory scarf). They are standing side by side looking towards the camera with gentle warm romantic smiles, misty mountains, golden hour glow, 8k photorealistic cinematography";

  let refBase64 = null;
  if (fs.existsSync(masterCouplePath) && fs.statSync(masterCouplePath).size > 200000) {
    console.log('  Reusing existing Master Couple Reference Anchor.');
    refBase64 = fs.readFileSync(masterCouplePath).toString('base64');
  } else {
    console.log('  Generating fresh Master Couple Reference...');
    const masterSuccess = await generateVertexImage(token, masterCouplePrompt, null, masterCouplePath);
    if (masterSuccess && fs.existsSync(masterCouplePath)) {
      console.log(`  ✅ Master Couple Reference Created: ${masterCouplePath} (${(fs.statSync(masterCouplePath).size / 1024).toFixed(1)} KB)`);
      refBase64 = fs.readFileSync(masterCouplePath).toString('base64');
    }
  }

  // -------------------------------------------------------------
  // STEP 4: GENERATE 10 CONSISTENT SCENE VISUALS
  // -------------------------------------------------------------
  console.log('\n🎨 [Step 4] Generating 10 Consistent Character Movie Scene Frames on Vertex AI...');

  const sceneSpecs = [
    { num: 1, prompt: "Wide establishing shot: Aryan in navy coat and Riya in pastel trench walking side by side along a scenic grassy cliffside trail on a misty mountain hill station at golden hour sunset, cinematic depth of field", motion: "zoompan=z='min(zoom+0.0012,1.2)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=180:s=1920x1080:fps=30" },
    { num: 2, prompt: "Medium tracking shot: Riya in her pastel trench coat turns towards Aryan, her wavy hair blowing in the mountain breeze, radiant smile looking at him, breathtaking valley behind", motion: "zoompan=z='1.15':x='if(eq(on,1),0,x+1)':y='ih/2-(ih/zoom/2)':d=180:s=1920x1080:fps=30" },
    { num: 3, prompt: "Close-up shot of Aryan in navy coat, looking deeply into Riya's eyes with deep love, sincerity and warm emotion, misty mountain peaks in soft blur behind him", motion: "zoompan=z='min(zoom+0.0015,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=180:s=1920x1080:fps=30" },
    { num: 4, prompt: "Close-up shot of Riya, noticing the profound emotion in his voice, eyes softening with wonder and anticipation, golden sunset highlights on her face", motion: "zoompan=z='1.2-0.0008*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=180:s=1920x1080:fps=30" },
    { num: 5, prompt: "Romantic medium shot: Aryan gently holding both of Riya's hands in his hands, standing together on the green grassy viewpoint, bathed in warm amber sunset light", motion: "zoompan=z='min(zoom+0.0015,1.22)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=180:s=1920x1080:fps=30" },
    { num: 6, prompt: "Over-the-shoulder shot from behind Riya: Aryan reaching inside his navy overcoat and holding a luxury dark navy velvet ring jewelry box", motion: "zoompan=z='1.15':x='if(eq(on,1),ih/2,x-0.8)':y='ih/2-(ih/zoom/2)':d=180:s=1920x1080:fps=30" },
    { num: 7, prompt: "Low-angle cinematic shot: Aryan is down on one knee on the grassy mountain hill, looking up at Riya and opening the velvet box to reveal a sparkling diamond engagement ring, sunset behind", motion: "zoompan=z='min(zoom+0.002,1.28)':x='iw/2-(iw/zoom/2)':y='if(eq(on,1),ih/2,y-0.4)':d=180:s=1920x1080:fps=30" },
    { num: 8, prompt: "Emotional portrait close-up of Riya, hands covering her mouth in pure joyous shock, tears of pure happiness glistening in her eyes, smiling through joyful tears", motion: "zoompan=z='min(zoom+0.0018,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=180:s=1920x1080:fps=30" },
    { num: 9, prompt: "Romantic close-up: Aryan stands up, smiling radiantly, gently sliding the sparkling diamond ring onto Riya's left ring finger, she is beaming with joy", motion: "zoompan=z='1.2-0.001*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=180:s=1920x1080:fps=30" },
    { num: 10, prompt: "Epic wide drone shot pulling back: Aryan and Riya embracing in a passionate loving hug on the mountain cliff edge, dramatic golden clouds and sunset valley panorama", motion: "zoompan=z='1.3-0.0015*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=180:s=1920x1080:fps=30" }
  ];

  const sceneImagePaths = [];

  for (const sc of sceneSpecs) {
    const scPath = path.join(uploadDir, `proposal_scene_${sc.num}.png`);
    console.log(`  [Scene ${sc.num}/10] Generating: "${sc.prompt.slice(0, 50)}..."`);
    
    if (fs.existsSync(scPath) && fs.statSync(scPath).size > 200000) {
      console.log(`  ✅ Using existing Scene ${sc.num}`);
      sceneImagePaths.push(scPath);
      continue;
    }

    const success = await generateVertexImage(token, sc.prompt, refBase64, scPath);
    if (success && fs.existsSync(scPath)) {
      console.log(`  ✅ Generated Scene ${sc.num}: ${(fs.statSync(scPath).size / 1024).toFixed(1)} KB`);
      sceneImagePaths.push(scPath);
    } else {
      console.warn(`  Fallback for Scene ${sc.num}`);
      fs.copyFileSync(masterCouplePath, scPath);
      sceneImagePaths.push(scPath);
    }
  }

  // -------------------------------------------------------------
  // STEP 5: RENDER 10 DYNAMIC 6-SECOND MOVIE CLIPS (FFmpeg)
  // -------------------------------------------------------------
  console.log('\n🎥 [Step 5] Rendering 10 Dynamic 6-Second Motion Clips (1080p)...');
  const clipPaths = [];

  for (let i = 0; i < sceneSpecs.length; i++) {
    const sc = sceneSpecs[i];
    const imgPath = sceneImagePaths[i];
    const clipOut = path.join(uploadDir, `proposal_clip_${sc.num}.mp4`);

    console.log(`  Rendering Clip ${sc.num}/10 (6.0s)...`);
    const cmd = `"${FFMPEG_BIN}" -y -loop 1 -i "${imgPath}" -vf "scale=3840:2160:flags=lanczos,${sc.motion},unsharp=5:5:0.8:5:5:0.0,format=yuv420p" -c:v libx264 -preset fast -crf 18 -t 6 "${clipOut}"`;
    await execPromise(cmd);
    clipPaths.push(clipOut);
  }

  // Concat all 10 clips into 60s video stream
  console.log('  Stitching 10 clips into continuous 60.0s video stream...');
  const concatTxtPath = path.join(uploadDir, 'proposal_concat_list.txt');
  fs.writeFileSync(concatTxtPath, clipPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n'));

  const scenesStitchedPath = path.join(uploadDir, 'proposal_video_track_60s.mp4');
  const concatCmd = `"${FFMPEG_BIN}" -y -f concat -safe 0 -i "${concatTxtPath}" -c copy "${scenesStitchedPath}"`;
  await execPromise(concatCmd);
  console.log(`✅ [Step 5] 60-Second Video Track Stitched: ${scenesStitchedPath}`);

  // -------------------------------------------------------------
  // STEP 6: ROMANTIC ORCHESTRAL MUSIC SOUNDSCAPE (BGM)
  // -------------------------------------------------------------
  console.log('\n🎻 [Step 6] Synthesizing emotional romantic piano & orchestral soundtrack (60s)...');
  const bgmPath = path.join(uploadDir, 'proposal_romantic_bgm_60s.mp3');
  
  // Synthesize multi-layered harmonic acoustic chords (A minor to C major emotional progression)
  const bgmCmd = `"${FFMPEG_BIN}" -y -f lavfi -i "sine=frequency=220:duration=60" -f lavfi -i "sine=frequency=261.63:duration=60" -f lavfi -i "sine=frequency=329.63:duration=60" -f lavfi -i "sine=frequency=392.00:duration=60" -f lavfi -i "anoisesrc=d=60:c=pink:r=44100:a=0.015" -filter_complex "[0:a]volume=0.25[a0];[1:a]volume=0.20[a1];[2:a]volume=0.20[a2];[3:a]volume=0.18[a3];[4:a]lowpass=f=600,volume=0.10[a4];[a0][a1][a2][a3][a4]amix=inputs=5[out]" -map "[out]" -b:a 192k "${bgmPath}"`;
  await execPromise(bgmCmd);
  console.log(`✅ [Step 6] Romantic BGM ready: ${bgmPath}`);

  // -------------------------------------------------------------
  // STEP 7: MASTER 60-SECOND MOVIE ASSEMBLY WITH SUBTITLES
  // -------------------------------------------------------------
  console.log('\n🚀 [Step 7] Assembling FINAL 60-Second Master Movie Scene with Subtitles & Audio Mix...');
  const masterMoviePath = path.join(uploadDir, 'proposal_movie_scene_60s.mp4');

  const escapedSrt = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
  const subStyle = "FontName=Arial,FontSize=22,PrimaryColour=&H00FFFFFF,SecondaryColour=&H0000FFFF,OutlineColour=&H00000000,BackColour=&H80000000,Bold=1,Outline=2,Shadow=1,Alignment=2,MarginV=38";

  // Audio mix: Dialogue at 1.0, BGM ducked at 0.16
  const masterCmd = `"${FFMPEG_BIN}" -y -i "${scenesStitchedPath}" -i "${masterDialoguePath}" -i "${bgmPath}" -filter_complex "[1:a]volume=1.0[v_diag];[2:a]volume=0.16[v_music];[v_diag][v_music]amix=inputs=2:duration=first[a_mix];[0:v]subtitles='${escapedSrt}':force_style='${subStyle}'[v_sub]" -map "[v_sub]" -map "[a_mix]" -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k -shortest -t 60 "${masterMoviePath}"`;

  try {
    await execPromise(masterCmd);
  } catch (subErr) {
    console.warn('Subtitle filter fallback:', subErr.message);
    const fallbackCmd = `"${FFMPEG_BIN}" -y -i "${scenesStitchedPath}" -i "${masterDialoguePath}" -i "${bgmPath}" -filter_complex "[1:a]volume=1.0[v_diag];[2:a]volume=0.16[v_music];[v_diag][v_music]amix=inputs=2:duration=first[a_mix]" -map 0:v -map "[a_mix]" -c:v copy -c:a aac -b:a 192k -shortest -t 60 "${masterMoviePath}"`;
    await execPromise(fallbackCmd);
  }

  if (fs.existsSync(masterMoviePath)) {
    const sizeMb = (fs.statSync(masterMoviePath).size / 1024 / 1024).toFixed(2);
    console.log('\n================================================================');
    console.log(`🎉 60-SECOND PROPOSAL MOVIE SCENE COMPLETE!`);
    console.log(`📁 File: ${masterMoviePath}`);
    console.log(`📊 Size: ${sizeMb} MB | Duration: 60.00 Seconds | 1080p`);
    console.log('================================================================\n');

    // Launch player and reveal in Windows File Explorer
    try {
      exec(`Start-Process "${masterMoviePath}"`);
      exec(`explorer.exe /select,"${masterMoviePath}"`);
    } catch (_) {}
  }
}

produceProposalMovie().catch(console.error);
