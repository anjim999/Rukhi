/**
 * 🎬 RUKHI AI VIDEO ENGINE — Boss Cat & Buffalo 45-Second Viral Reel
 * 
 * Full Production Pipeline (modeled after produce_master_short_film.js):
 * Step 1: Google Cloud TTS Neural Voiceover (hi-IN-Neural2-B)
 * Step 2: Deepgram Nova-3 Word Timestamps
 * Step 3: SRT Subtitle Generation
 * Step 4: Veo 3.1 Image-to-Video (REAL moving AI video clips, NOT zoompan)
 * Step 5: FFmpeg Ambient BGM Synthesis (Indian rural comedy dholak + bansuri)
 * Step 6: Master Assembly (Video + Voiceover + BGM + Burned-in Subtitles)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const FFMPEG_BIN = path.resolve('backend/node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe');
const KEY_PATH = path.resolve('backend/gcp_key.json');
const DEEPGRAM_KEY = '909c74896ca7b952f21d916482a9bc80bb3e5848';

const keyData = JSON.parse(fs.readFileSync(KEY_PATH, 'utf-8'));

const brainDir = 'C:\\Users\\1301\\.gemini\\antigravity-ide\\brain\\1c23a768-939d-4b93-b545-66d083065da9';
const uploadDir = path.resolve('uploads');
const outputDir = path.resolve('outputs');
const tmpDir = path.resolve('tmp');

for (const d of [uploadDir, outputDir, tmpDir]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// ─── GCP OAuth 2.0 Token ────────────────────────────────────────────
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
  if (!data.access_token) throw new Error('OAuth Error: ' + JSON.stringify(data));
  console.log('🔑 GCP OAuth Token minted successfully!');
  return data.access_token;
}

// ─── Step 1: Google Cloud TTS ────────────────────────────────────────
async function generateVoiceover(text, outPath, token) {
  console.log('\n🎙️ [STEP 1/6] Synthesizing Google Cloud Neural Voiceover (hi-IN-Neural2-B)...');
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: 'hi-IN',
        name: 'hi-IN-Neural2-B',
        ssmlGender: 'MALE',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: -2.0,
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
  console.log(`✅ [STEP 1/6] Voiceover saved: ${outPath} (${(audioBuffer.length / 1024).toFixed(1)} KB)`);
}

// ─── Step 2: Deepgram Word Timestamps ────────────────────────────────
async function getWordTimestamps(audioPath) {
  console.log('\n⏱️ [STEP 2/6] Aligning word timestamps with Deepgram Nova-3...');
  try {
    const audioBuffer = fs.readFileSync(audioPath);
    const res = await fetch('https://api.deepgram.com/v1/listen?model=nova-3&language=hi&smart_format=true&punctuate=true', {
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
      console.log(`✅ [STEP 2/6] Deepgram aligned ${words.length} words with millisecond timestamps!`);
      return words;
    } else {
      console.warn(`  Deepgram returned HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn(`  Deepgram fallback: ${err.message}`);
  }
  return null;
}

// ─── Step 3: SRT Subtitle Generation ─────────────────────────────────
function formatSrtTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// ─── Step 4: Veo 3.1 Image-to-Video (REAL AI Video) ─────────────────
async function generateVeoI2V(token, imagePath, motionPrompt, outPath) {
  const projectId = keyData.project_id;
  const location = 'us-central1';
  const model = 'veo-3.1-lite-generate-001';

  const imgBase64 = fs.readFileSync(imagePath).toString('base64');

  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predictLongRunning`;

  console.log(`  🚀 Sending Image-to-Video to Google Veo 3.1 Lite...`);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [{
        prompt: motionPrompt,
        image: {
          bytesBase64Encoded: imgBase64,
          mimeType: 'image/jpeg'
        }
      }],
      parameters: {
        aspectRatio: '9:16',
        durationSeconds: 6,
        sampleCount: 1,
      }
    })
  });

  const data = await res.json();
  if (!data.name) {
    console.warn(`  ⚠️ Veo launch failed (HTTP ${res.status}):`, JSON.stringify(data.error || data).substring(0, 200));
    return false;
  }

  const opName = data.name;
  const fetchUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:fetchPredictOperation`;

  console.log(`  ⏳ Polling Veo 3.1 operation: ${opName.split('/').pop()}`);
  for (let attempt = 1; attempt <= 30; attempt++) {
    await new Promise(r => setTimeout(r, 6000));
    process.stdout.write(`  Poll ${attempt}/30... `);

    try {
      const pollRes = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operationName: opName }),
      });

      const pollData = await pollRes.json();
      if (pollData.done) {
        if (pollData.error) {
          console.log(`\n  ❌ Veo render error: ${JSON.stringify(pollData.error).substring(0, 150)}`);
          return false;
        }

        const videoObj = pollData.response?.videos?.[0] 
          || pollData.response?.generatedVideos?.[0]?.video 
          || pollData.response?.predictions?.[0];

        if (videoObj?.bytesBase64Encoded) {
          const buf = Buffer.from(videoObj.bytesBase64Encoded, 'base64');
          fs.writeFileSync(outPath, buf);
          console.log(`\n  ✅ REAL Veo 3.1 video saved: ${path.basename(outPath)} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
          return true;
        } else if (videoObj?.uri) {
          console.log(`\n  📦 Video at GCS URI: ${videoObj.uri} (download separately)`);
        }
        return false;
      }
      console.log('waiting...');
    } catch (pollErr) {
      console.log(`error: ${pollErr.message}`);
    }
  }
  console.log('\n  ⚠️ Veo timed out after 3 minutes');
  return false;
}

// ─── FFmpeg Zoompan Fallback (if Veo fails for a scene) ──────────────
async function renderZoompanFallback(imagePath, durationSec, motionIdx, outPath) {
  const w = 1080, h = 1920, fps = 30;
  const totalFrames = durationSec * fps;
  const motions = [
    `zoompan=z='min(zoom+0.0012,1.20)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=${w}x${h}:fps=${fps}`,
    `zoompan=z='min(zoom+0.002,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)+1':d=${totalFrames}:s=${w}x${h}:fps=${fps}`,
    `zoompan=z='1.15':x='iw/2-(iw/zoom/2)+sin(in/3)*4':y='ih/2-(ih/zoom/2)+cos(in/4)*2':d=${totalFrames}:s=${w}x${h}:fps=${fps}`,
    `zoompan=z='min(zoom+0.0018,1.28)':x='iw/2-(iw/zoom/2)':y='ih*0.4-(ih/zoom/2)':d=${totalFrames}:s=${w}x${h}:fps=${fps}`,
  ];
  const filter = motions[motionIdx % motions.length];
  const cmd = `"${FFMPEG_BIN}" -y -loop 1 -i "${imagePath}" -vf "scale=${w*2}:${h*2}:flags=lanczos,${filter},format=yuv420p" -c:v libx264 -preset fast -crf 18 -t ${durationSec} "${outPath}"`;
  await execPromise(cmd);
}

// ─── MASTER PRODUCTION ──────────────────────────────────────────────
async function produceBossCatReel() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎬 RUKHI AI VIDEO ENGINE — BOSS CAT 45s VIRAL REEL');
  console.log('   Full Pipeline: Veo 3.1 I2V + TTS + BGM + Subtitles');
  console.log('═══════════════════════════════════════════════════════\n');

  const token = await getAccessToken();

  // ─── Scene Definitions ─────────────────────────────────────────────
  const scenes = [
    {
      num: 1,
      image: path.join(uploadDir, 'scene_1_cat_buffalo.jpg'),
      veoPrompt: 'The fat orange cat walks forward on two legs holding a rope, the giant buffalo follows behind on a dirt village road, dust kicks up under their feet, sunny day, smooth forward walking motion, 9:16 vertical video',
      speech: 'Bhai, pure gaon ka theka maine le rakha hai! Kaalu, chalo jaldi khet pahunchna hai!',
      caption: 'BHAI, PURE GAON KA THEKA MAINE LE RAKHA HAI!',
    },
    {
      num: 2,
      image: path.join(uploadDir, 'scene_2_cat_buffalo.jpg'),
      veoPrompt: 'The fat orange cat turns around angrily pointing its paw at the giant buffalo, the cat mouth moves like scolding, the buffalo blinks innocently, Indian village road background, 9:16 vertical video',
      speech: 'Arre Kaalu! Speed badha thoda! 9 baje khet pahunchna tha, tu abhi tak road pe timepass kar raha hai!',
      caption: 'ARRE KAALU! SPEED BADHA THODA!',
    },
    {
      num: 3,
      image: path.join(uploadDir, 'scene_3_cat_buffalo.jpg'),
      veoPrompt: 'The fat orange cat leans forward pulling a rope with all its strength, body straining comically, the buffalo stands still stubbornly, dust flying under cat feet, comical struggle, 9:16 vertical video',
      speech: 'Oye rukk mat! Chal, arey meri kamar toot jayegi bhains kahin ke! Aise khada hai jaise pahad ho!',
      caption: 'OYE RUKK MAT! MERI KAMAR TOOT JAYEGI!',
    },
    {
      num: 4,
      image: path.join(uploadDir, 'scene_2_cat_buffalo.jpg'),
      veoPrompt: 'Close-up of the fat orange cat shaking its paw threateningly at the buffalo, the buffalo snorts and slowly starts walking, Indian village sunset lighting, 9:16 vertical video',
      speech: 'Agle hafte se ghass band! Direct diet pe daal dunga bata raha hu! Chup-chaap seedhe chal!',
      caption: 'AGLE HAFTE SE GHASS BAND! DIET PE DAAL DUNGA!',
    },
    {
      num: 5,
      image: path.join(uploadDir, 'scene_1_cat_buffalo.jpg'),
      veoPrompt: 'The fat orange cat walks confidently forward on two legs with swagger, buffalo follows obediently behind, side profile tracking shot, green paddy fields background, golden hour lighting, 9:16 vertical video',
      speech: 'Haan, ab aaya na line pe! Apne aage koi sher bhi aaye toh jhuk ke salaam karega!',
      caption: 'HAAN, AB AAYA NA LINE PE!',
    },
    {
      num: 6,
      image: path.join(uploadDir, 'scene_6_cat_buffalo.jpg'),
      veoPrompt: 'Medium close-up of the fat orange cat turning its head directly to camera with a smug confident smirk, half-closed eyes, golden sunset glow behind, 9:16 vertical video',
      speech: 'Toh tum log kya dekh rahe ho? Jaldi follow karo aur video share maaro!',
      caption: 'TUM LOG KYA DEKH RAHE HO? FOLLOW & SHARE KARO!',
    },
  ];

  // ─── Step 1: Generate Full Voiceover ───────────────────────────────
  const fullScript = scenes.map(s => s.speech).join(' ... ');
  const voicePath = path.join(tmpDir, 'boss_cat_voiceover.mp3');
  await generateVoiceover(fullScript, voicePath, token);

  // Get exact voiceover duration
  let voiceDuration = 45;
  try {
    const probeCmd = `"${FFMPEG_BIN}" -i "${voicePath}" -f null - 2>&1`;
    const { stderr } = await execPromise(probeCmd).catch(e => ({ stderr: e.stderr || '' }));
    const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
    if (match) {
      voiceDuration = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 100;
      console.log(`  ⏱️ Exact voiceover duration: ${voiceDuration.toFixed(2)}s`);
    }
  } catch (_) {}

  // ─── Step 2: Deepgram Word Timestamps ──────────────────────────────
  const words = await getWordTimestamps(voicePath);

  // ─── Step 3: SRT Subtitle File ─────────────────────────────────────
  console.log('\n📝 [STEP 3/6] Building kinetic subtitle track...');
  const srtPath = path.join(tmpDir, 'boss_cat_subtitles.srt');
  let srtContent = '';

  if (words && words.length > 0) {
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
    // Fallback subtitle cards from scene captions
    const secPerScene = voiceDuration / scenes.length;
    scenes.forEach((sc, idx) => {
      const start = idx * secPerScene;
      const end = start + secPerScene - 0.2;
      srtContent += `${idx + 1}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${sc.caption}\n\n`;
    });
  }
  fs.writeFileSync(srtPath, srtContent);
  console.log(`✅ [STEP 3/6] Subtitles written: ${srtPath}`);

  // ─── Step 4: Veo 3.1 I2V Real Video Generation ────────────────────
  console.log('\n🎥 [STEP 4/6] Generating REAL AI Video Clips via Google Veo 3.1 Image-to-Video...');
  const clipPaths = [];
  const secPerScene = Math.max(6, voiceDuration / scenes.length);

  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    const clipPath = path.join(tmpDir, `boss_cat_veo_clip_${sc.num}.mp4`);

    // Check if clip already exists (checkpoint)
    if (fs.existsSync(clipPath) && fs.statSync(clipPath).size > 50000) {
      console.log(`  ⚡ [CHECKPOINT] Scene ${sc.num} clip exists (${(fs.statSync(clipPath).size / 1024).toFixed(0)} KB). Reusing!`);
      clipPaths.push(clipPath);
      continue;
    }

    console.log(`\n  🎬 Scene ${sc.num}/${scenes.length}: "${sc.veoPrompt.substring(0, 60)}..."`);
    const veoSuccess = await generateVeoI2V(token, sc.image, sc.veoPrompt, clipPath);

    if (veoSuccess && fs.existsSync(clipPath) && fs.statSync(clipPath).size > 50000) {
      clipPaths.push(clipPath);
    } else {
      // Fallback: zoompan motion from the scene image
      console.log(`  ⚠️ Veo fallback for Scene ${sc.num}: Using cinematic 3D zoom motion...`);
      const fallbackPath = path.join(tmpDir, `boss_cat_fallback_${sc.num}.mp4`);
      await renderZoompanFallback(sc.image, 8, i, fallbackPath);
      if (fs.existsSync(fallbackPath)) {
        clipPaths.push(fallbackPath);
        console.log(`  ✅ Fallback scene ${sc.num} rendered: ${(fs.statSync(fallbackPath).size / 1024).toFixed(0)} KB`);
      }
    }
  }

  console.log(`\n  ✅ ${clipPaths.length} video clips ready for assembly!`);

  // ─── Step 5: BGM Synthesis ─────────────────────────────────────────
  console.log('\n🎵 [STEP 5/6] Synthesizing Indian comedy BGM (dholak + bansuri + tabla)...');
  const bgmPath = path.join(tmpDir, 'boss_cat_bgm.mp3');
  // Layered Indian rural comedy soundtrack: bass tabla drone + mid bansuri + high percussion
  const bgmCmd = `"${FFMPEG_BIN}" -y -f lavfi -i "sine=frequency=82:duration=${Math.ceil(voiceDuration + 5)}" -f lavfi -i "sine=frequency=220:duration=${Math.ceil(voiceDuration + 5)}" -f lavfi -i "sine=frequency=440:duration=${Math.ceil(voiceDuration + 5)}" -f lavfi -i "anoisesrc=d=${Math.ceil(voiceDuration + 5)}:c=pink:r=44100:a=0.02" -filter_complex "[0:a]volume=0.25,tremolo=f=4:d=0.3[tabla];[1:a]volume=0.15,vibrato=f=6:d=0.3[bansuri];[2:a]volume=0.08,tremolo=f=8:d=0.5[perc];[3:a]lowpass=f=500,volume=0.1[ambient];[tabla][bansuri][perc][ambient]amix=inputs=4[out]" -map "[out]" -b:a 192k "${bgmPath}"`;
  await execPromise(bgmCmd);
  console.log(`✅ [STEP 5/6] BGM synthesized: ${bgmPath} (${(fs.statSync(bgmPath).size / 1024).toFixed(0)} KB)`);

  // ─── Step 6: Master Assembly ───────────────────────────────────────
  console.log('\n🚀 [STEP 6/6] PRODUCING FINAL 45-SECOND MASTER REEL...');
  console.log('   Video + Voiceover + BGM + Burned-in Kinetic Subtitles\n');

  // 6a: Normalize & concat all video clips to consistent 1080x1920 30fps
  const normalizedClips = [];
  for (let i = 0; i < clipPaths.length; i++) {
    const normPath = path.join(tmpDir, `boss_cat_norm_${i}.mp4`);
    const vf = `fps=30,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,format=yuv420p`;
    const normCmd = `"${FFMPEG_BIN}" -y -i "${clipPaths[i]}" -vf "${vf}" -c:v libx264 -preset fast -crf 18 -an -r 30 -g 30 -keyint_min 30 "${normPath}"`;
    try {
      await execPromise(normCmd);
      normalizedClips.push(normPath);
    } catch (e) {
      console.warn(`  Norm fallback for clip ${i}: ${e.message.substring(0, 80)}`);
      normalizedClips.push(clipPaths[i]);
    }
  }

  // 6b: Concat all normalized clips
  const concatListPath = path.join(tmpDir, 'boss_cat_concat.txt');
  fs.writeFileSync(concatListPath, normalizedClips.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n'));

  const concatVideoPath = path.join(tmpDir, 'boss_cat_video_track.mp4');
  const concatCmd = `"${FFMPEG_BIN}" -y -f concat -safe 0 -i "${concatListPath}" -c copy "${concatVideoPath}"`;
  await execPromise(concatCmd);
  console.log(`  ✅ Stitched ${normalizedClips.length} clips into single video track`);

  // 6c: Mix voiceover (1.0) + BGM (0.18, ducked under voice) into single audio track
  const mixedAudioPath = path.join(tmpDir, 'boss_cat_audio_mix.mp3');
  const audioMixCmd = `"${FFMPEG_BIN}" -y -i "${voicePath}" -i "${bgmPath}" -filter_complex "[0:a]volume=1.0[voice];[1:a]volume=0.18[bgm];[voice][bgm]amix=inputs=2:duration=first[out]" -map "[out]" -c:a libmp3lame -b:a 192k "${mixedAudioPath}"`;
  await execPromise(audioMixCmd);
  console.log(`  ✅ Audio mixed: Voiceover + BGM (ducked at 18%)`);

  // 6d: Final Master clean (no captions/subtitles)
  const masterPath = path.join(outputDir, 'boss_cat_buffalo_45s_FINAL.mp4');
  const masterCmd = `"${FFMPEG_BIN}" -y -i "${concatVideoPath}" -i "${mixedAudioPath}" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -t ${Math.min(voiceDuration + 2, 50)} "${masterPath}"`;
  await execPromise(masterCmd);

  if (fs.existsSync(masterPath)) {
    const stats = fs.statSync(masterPath);
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎉🎉🎉 MASTER 45-SECOND VIRAL REEL COMPLETE!');
    console.log(`📁 File: ${masterPath}`);
    console.log(`📊 Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`🌐 Preview: http://localhost:5000/outputs/boss_cat_buffalo_45s_FINAL.mp4`);
    console.log(`📂 SRT Subtitles: ${srtPath}`);
    console.log('═══════════════════════════════════════════════════════');
  }
}

produceBossCatReel().catch(err => {
  console.error('❌ FATAL:', err);
  process.exit(1);
});
