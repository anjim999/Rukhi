/**
 * 🎬 RUKHI HOLLYWOOD ENGINE — 2-Minute Cinematic Short Film
 * 
 * "THE LEGEND OF RAJA" — A 3D Pixar-style cinematic village adventure
 * 
 * Pipeline: Veo 3.1 T2V → Google TTS → Deepgram → BGM → SFX → Master Assembly
 * Format: 16:9 Widescreen, 1920x1080, 30fps, 2 minutes
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

const uploadDir = path.resolve('uploads');
const outputDir = path.resolve('outputs');
const tmpDir = path.resolve('tmp/hollywood');
for (const d of [uploadDir, outputDir, tmpDir]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// Character anchor — same description in EVERY Veo prompt for consistency
const CHARACTER = 'a small brave 8-year-old Indian village boy named Raja wearing a faded yellow kurta and brown shorts, messy black hair, big expressive brown Pixar eyes, barefoot, 3D Disney Pixar animation style';

// ═══════════════════════════════════════════════════════════════════
// SCENE DEFINITIONS — 20 scenes × 6s = 120 seconds (2 minutes)
// ═══════════════════════════════════════════════════════════════════
const scenes = [
  // ACT 1: THE MORNING (0:00 - 0:30)
  { id: 1, prompt: `Cinematic wide establishing shot of a beautiful Indian village at golden sunrise, mist rising from emerald green rice paddy terraces, mud houses with terracotta roofs, coconut palms swaying, a winding river reflecting gold sky, camera slowly pushing forward, ultra detailed 3D animation, 16:9 widescreen`, narration: `In the heart of India, nestled between ancient mountains and golden rice fields, there lies a tiny village that the world forgot.` },
  { id: 2, prompt: `Medium shot of ${CHARACTER}, waking up on a bamboo cot inside a small mud house, stretching his arms wide with a big yawn, morning sunlight streaming through a small window casting golden rays on his face, dust particles floating in light, cinematic interior lighting, 16:9`, narration: `But this village has a secret. A boy named Raja, just eight years old, with a heart bigger than the mountains themselves.` },
  { id: 3, prompt: `${CHARACTER} splashing water on his face from a brass pot outside his mud house, shaking his wet hair with a happy grin, his old grandmother in white saree smiling in the doorway behind him, morning village atmosphere, chickens walking around, 16:9 cinematic`, narration: `Every morning, Raja wakes before the sun. His grandmother says he has the spirit of a lion trapped inside a mouse.` },
  { id: 4, prompt: `Wide tracking shot of ${CHARACTER} running barefoot through narrow village lanes, jumping over puddles, waving at friendly villagers, colorful clothes hanging on lines, a temple bell ringing in the distance, dynamic camera following him, 3D Pixar animation, 16:9`, narration: `He runs through the village like the wind itself, greeting every soul, every animal, every tree as if they were old friends.` },
  { id: 5, prompt: `${CHARACTER} sitting under a massive ancient banyan tree, feeding pieces of roti bread to a group of birds and a stray dog, peaceful morning light filtering through leaves creating dappled shadows, close-up on his gentle smiling face, cinematic depth of field, 16:9`, narration: `Under the great banyan tree, Raja shares his breakfast with those who have none. He believes kindness is the strongest superpower.` },

  // ACT 2: THE CRISIS (0:30 - 1:00)
  { id: 6, prompt: `Dramatic wide shot of dark ominous storm clouds rolling in fast over the peaceful Indian village, wind picking up violently, palm trees bending, villagers looking up at the sky with worried faces, dramatic lighting shift from golden to dark grey, cinematic 16:9`, narration: `But one morning, the sky turned black. A storm unlike anything the village had ever seen began to roll in from the mountains.` },
  { id: 7, prompt: `Heavy rain pouring down on the Indian village, muddy water rushing through streets, villagers running for cover carrying children, lightning flashing across dark sky illuminating terrified faces, dramatic cinematic rain effects, 3D Pixar style, 16:9`, narration: `The rains came crashing down like a waterfall from the heavens. The river began to rise, and the village began to flood.` },
  { id: 8, prompt: `Close-up dramatic shot of ${CHARACTER} standing in heavy rain, water dripping from his hair, looking determined with clenched fists, lightning reflecting in his big brown eyes, dramatic low angle hero shot, rain particles visible, cinematic 16:9`, narration: `While everyone ran to hide, Raja stood still. He looked at the rising water. He looked at the old bridge. And he knew what he had to do.` },
  { id: 9, prompt: `${CHARACTER} running through knee-deep muddy flood water toward an old wooden bridge over a swollen river, rain pouring, dramatic camera tracking alongside him, splashing water everywhere, heroic determination on his face, cinematic action sequence, 16:9`, narration: `He ran through the flood waters toward the old bridge. The same bridge that connects the village to the only road out. If it breaks, the village is trapped.` },
  { id: 10, prompt: `Wide dramatic shot of a damaged wooden bridge over a raging brown river, one support beam cracking and tilting, water smashing against the wooden pillars, debris flowing past, storm clouds above, cinematic disaster movie framing, 3D animation, 16:9`, narration: `The bridge was breaking apart. The ancient wooden beams were cracking under the force of the raging river. Minutes away from total collapse.` },

  // ACT 3: THE HERO (1:00 - 1:30)
  { id: 11, prompt: `${CHARACTER} grabbing a thick rope from a nearby tree, tying it around his waist, wading into chest-deep rushing water toward the broken bridge support beam, extreme determination on his face, rain pouring, dramatic cinematic hero moment, 16:9`, narration: `Raja grabbed the thickest rope he could find. He tied it around his waist, took a deep breath, and stepped into the raging current.` },
  { id: 12, prompt: `Underwater slow motion shot of ${CHARACTER} swimming through murky brown flood water, air bubbles rising, his yellow kurta billowing in the current, shafts of dim light from above, dramatic underwater cinematography, 3D Pixar style, 16:9`, narration: `The water tried to swallow him whole. The current pulled at his legs. But Raja pushed forward. One stroke at a time.` },
  { id: 13, prompt: `${CHARACTER} reaching the broken bridge support beam, wrapping the rope tightly around the cracking wood with both hands, muscles straining, rain and river spray on his face, dramatic close-up of his hands tying the knot, cinematic 16:9`, narration: `He reached the breaking beam. With frozen fingers, he wrapped the rope around the cracking wood and pulled with everything he had.` },
  { id: 14, prompt: `Wide cinematic shot of villagers arriving at the riverbank, elderly men and women gasping seeing the small boy holding the bridge together in the storm, some villagers grabbing ropes to help, dramatic emotional moment, rain, 16:9`, narration: `The villagers arrived at the riverbank. They saw little Raja, alone in the storm, holding the bridge together with nothing but a rope and raw courage.` },
  { id: 15, prompt: `Multiple Indian villagers pulling ropes together alongside ${CHARACTER}, working as a team in the rain to reinforce the bridge, elderly men, women in sarees, young men, all united, dramatic teamwork montage, cinematic rain, 3D Pixar, 16:9`, narration: `One by one, they joined him. Young and old, they grabbed the ropes and pulled together. The village had found its strength again.` },

  // ACT 4: THE TRIUMPH (1:30 - 2:00)
  { id: 16, prompt: `Dramatic wide shot of storm clouds breaking apart, golden sunlight piercing through dark clouds in massive god rays over the Indian village, the reinforced bridge standing strong over the calming river, beautiful rainbow forming, cinematic sky, 16:9`, narration: `And then, as if the heavens heard their prayers, the storm began to break. Golden light poured through the clouds like a blessing from above.` },
  { id: 17, prompt: `${CHARACTER} sitting exhausted but smiling on the riverbank, soaking wet, villagers wrapping a warm blanket around his shoulders, his grandmother hugging him tightly with tears of joy, golden sunset light, emotional cinematic close-up, 16:9`, narration: `Raja sat on the bank, exhausted but smiling. His grandmother wrapped him in a blanket and held him like she would never let go.` },
  { id: 18, prompt: `Beautiful golden sunset over the Indian village, the repaired bridge in foreground, calm river reflecting orange and purple sky, birds flying in formation across the sunset, peaceful atmosphere, ultra cinematic wide landscape shot, 3D Pixar style, 16:9`, narration: `The bridge held. The village was saved. And the little boy who everyone thought was too small, too young, too weak, had proven them all wrong.` },
  { id: 19, prompt: `${CHARACTER} walking through the village at sunset, villagers bowing their heads and folding hands in respect as he passes, flower petals being thrown, warm golden light, heroic slow motion walk, triumphant cinematic moment, 16:9`, narration: `From that day forward, the village never forgot. They called him Raja, not just by name, but by title. The King of the village.` },
  { id: 20, prompt: `Final cinematic wide shot of ${CHARACTER} sitting on the hilltop overlooking the entire village at twilight, stars beginning to appear in the purple sky, the village glowing with warm lantern lights below, his silhouette against the vast sky, epic cinematic ending frame, 3D Pixar, 16:9`, narration: `Because true courage is not about being the biggest or the strongest. It is about being the one who stands up when everyone else sits down.` },
];

// ═══════════════════════════════════════════════════════════════════

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claimSet = Buffer.from(JSON.stringify({
    iss: keyData.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: keyData.token_uri,
    exp: now + 3600, iat: now,
  })).toString('base64url');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${claimSet}`);
  const signature = signer.sign(keyData.private_key, 'base64url');
  const res = await fetch(keyData.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${claimSet}.${signature}` }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('OAuth failed: ' + JSON.stringify(data));
  return data.access_token;
}

async function generateVeoClip(token, prompt, outPath) {
  const projectId = keyData.project_id;
  const loc = 'us-central1';
  const model = 'veo-3.1-lite-generate-001';
  const url = `https://${loc}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${loc}/publishers/google/models/${model}:predictLongRunning`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { aspectRatio: '16:9', durationSeconds: 6, sampleCount: 1 }
    })
  });
  const data = await res.json();
  if (!data.name) { console.warn(`    Veo launch failed: ${JSON.stringify(data.error || data).substring(0, 150)}`); return false; }

  const fetchUrl = `https://${loc}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${loc}/publishers/google/models/${model}:fetchPredictOperation`;
  for (let i = 1; i <= 35; i++) {
    await new Promise(r => setTimeout(r, 5000));
    try {
      const pollRes = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName: data.name }),
      });
      const pd = await pollRes.json();
      if (pd.done) {
        if (pd.error) { console.warn(`    Veo error: ${pd.error.message || ''}`); return false; }
        const vid = pd.response?.videos?.[0] || pd.response?.generatedVideos?.[0]?.video || pd.response?.predictions?.[0];
        if (vid?.bytesBase64Encoded) {
          fs.writeFileSync(outPath, Buffer.from(vid.bytesBase64Encoded, 'base64'));
          return true;
        }
        return false;
      }
      if (i % 5 === 0) process.stdout.write(`${i}..`);
    } catch (_) {}
  }
  return false;
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  🎬 RUKHI HOLLYWOOD ENGINE — "THE LEGEND OF RAJA"       ║');
  console.log('║  2-Minute Cinematic Short Film | 16:9 | 1920×1080       ║');
  console.log('║  20 Scenes × Veo 3.1 + TTS + BGM + SFX + Subtitles     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  let token = await getAccessToken();
  console.log('🔑 GCP OAuth Token ready!\n');

  // ─── STEP 1: Full Voiceover ────────────────────────────────────────
  console.log('🎙️ [1/5] Generating cinematic voiceover (en-US-Neural2-J)...');
  const fullNarration = scenes.map(s => s.narration).join(' ');
  const voicePath = path.join(tmpDir, 'narration.mp3');

  if (fs.existsSync(voicePath) && fs.statSync(voicePath).size > 10000) {
    console.log('  ⚡ Checkpoint: voiceover exists, reusing!');
  } else {
    const ttsRes = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: fullNarration },
        voice: { languageCode: 'en-US', name: 'en-US-Neural2-J', ssmlGender: 'MALE' },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 0.92, pitch: -3.0 },
      }),
    });
    if (!ttsRes.ok) throw new Error('TTS failed: ' + await ttsRes.text());
    const ttsData = await ttsRes.json();
    fs.writeFileSync(voicePath, Buffer.from(ttsData.audioContent, 'base64'));
    console.log(`  ✅ Voiceover: ${(fs.statSync(voicePath).size / 1024).toFixed(0)} KB`);
  }

  // ─── STEP 2: Deepgram Word Timestamps ──────────────────────────────
  console.log('\n⏱️ [2/5] Deepgram Nova-3 word alignment...');
  const srtPath = path.join(tmpDir, 'subtitles.srt');
  let words = null;
  try {
    const dgRes = await fetch('https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true', {
      method: 'POST',
      headers: { 'Authorization': `Token ${DEEPGRAM_KEY}`, 'Content-Type': 'audio/mp3' },
      body: fs.readFileSync(voicePath),
    });
    if (dgRes.ok) {
      const dgData = await dgRes.json();
      words = dgData.results?.channels?.[0]?.alternatives?.[0]?.words || [];
      console.log(`  ✅ Aligned ${words.length} words`);
    }
  } catch (_) {}

  // Build SRT
  let srt = '';
  const fmt = (s) => { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=Math.floor(s%60),ms=Math.floor((s%1)*1000); return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')},${String(ms).padStart(3,'0')}`; };
  if (words && words.length > 0) {
    let idx = 1;
    for (let i = 0; i < words.length; i += 5) {
      const sl = words.slice(i, i + 5);
      srt += `${idx}\n${fmt(sl[0].start)} --> ${fmt(sl[sl.length-1].end)}\n${sl.map(w => w.punctuated_word || w.word).join(' ').toUpperCase()}\n\n`;
      idx++;
    }
  } else {
    scenes.forEach((s, i) => { srt += `${i+1}\n${fmt(i*6)} --> ${fmt((i+1)*6-0.3)}\n${s.narration.toUpperCase()}\n\n`; });
  }
  fs.writeFileSync(srtPath, srt);
  console.log(`  ✅ Subtitles: ${srtPath}`);

  // ─── STEP 3: Veo 3.1 Video Generation (20 scenes) ─────────────────
  console.log('\n🎥 [3/5] Generating 20 cinematic Veo 3.1 clips (this takes ~15 min)...');
  const clipPaths = [];
  let consecutiveFailures = 0;

  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    const clipPath = path.join(tmpDir, `scene_${sc.id}.mp4`);

    if (fs.existsSync(clipPath) && fs.statSync(clipPath).size > 50000) {
      console.log(`  ⚡ Scene ${sc.id}/20 checkpoint hit! (${(fs.statSync(clipPath).size/1024/1024).toFixed(1)}MB)`);
      clipPaths.push(clipPath);
      consecutiveFailures = 0;
      continue;
    }

    // Refresh token every 10 scenes (tokens expire in 1hr)
    if (i > 0 && i % 10 === 0) {
      token = await getAccessToken();
      console.log('  🔑 Token refreshed');
    }

    console.log(`  🎬 Scene ${sc.id}/20: "${sc.prompt.substring(0, 55)}..."`);
    const ok = await generateVeoClip(token, sc.prompt, clipPath);
    
    if (ok && fs.existsSync(clipPath) && fs.statSync(clipPath).size > 50000) {
      console.log(`  ✅ Scene ${sc.id}: ${(fs.statSync(clipPath).size/1024/1024).toFixed(1)}MB`);
      clipPaths.push(clipPath);
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;
      console.warn(`  ⚠️ Scene ${sc.id} failed (${consecutiveFailures} consecutive)`);
      // If 3+ consecutive failures, likely quota/auth issue — stop burning credits
      if (consecutiveFailures >= 3) {
        console.error('  ❌ 3 consecutive failures — stopping Veo generation to protect credits.');
        break;
      }
    }
  }

  console.log(`\n  📊 Generated ${clipPaths.length}/${scenes.length} clips`);
  if (clipPaths.length < 5) { console.error('❌ Too few clips to assemble.'); process.exit(1); }

  // ─── STEP 4: BGM Synthesis ─────────────────────────────────────────
  console.log('\n🎵 [4/5] Synthesizing cinematic orchestral BGM...');
  const bgmWav = path.join(tmpDir, 'bgm.wav');
  const bgmMp3 = path.join(tmpDir, 'bgm.mp3');
  const dur = clipPaths.length * 6 + 10;
  // Cinematic: deep bass foundation + warm mid strings + high shimmer
  await execPromise(`"${FFMPEG_BIN}" -y -f lavfi -i "sine=frequency=55:duration=${dur}" -f lavfi -i "sine=frequency=130:duration=${dur}" -f lavfi -i "sine=frequency=330:duration=${dur}" -f lavfi -i "anoisesrc=d=${dur}:c=pink:r=44100:a=0.01" -filter_complex "[0:a]volume=0.2[bass];[1:a]volume=0.12[mid];[2:a]volume=0.06[high];[3:a]lowpass=f=300,volume=0.08[amb];[bass][mid][high][amb]amix=inputs=4[out]" -map "[out]" -c:a pcm_s16le "${bgmWav}"`);
  await execPromise(`"${FFMPEG_BIN}" -y -i "${bgmWav}" -c:a libmp3lame -b:a 128k "${bgmMp3}"`);
  console.log(`  ✅ BGM: ${(fs.statSync(bgmMp3).size/1024).toFixed(0)} KB`);

  // ─── STEP 5: Master Assembly ───────────────────────────────────────
  console.log('\n🚀 [5/5] MASTER ASSEMBLY — Hollywood Grade Final Render...\n');

  // Normalize all clips to 1920x1080 30fps
  const normClips = [];
  for (let i = 0; i < clipPaths.length; i++) {
    const np = path.join(tmpDir, `norm_${i}.mp4`);
    try {
      await execPromise(`"${FFMPEG_BIN}" -y -i "${clipPaths[i]}" -vf "fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p" -c:v libx264 -preset fast -crf 18 -an -r 30 -g 30 "${np}"`);
      normClips.push(np);
      console.log(`  ✅ Norm ${i+1}/${clipPaths.length}`);
    } catch (_) { normClips.push(clipPaths[i]); }
  }

  // Concat
  const concatFile = path.join(tmpDir, 'concat.txt');
  fs.writeFileSync(concatFile, normClips.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n'));
  const videoTrack = path.join(tmpDir, 'video_track.mp4');
  await execPromise(`"${FFMPEG_BIN}" -y -f concat -safe 0 -i "${concatFile}" -c copy "${videoTrack}"`);
  console.log(`  ✅ Video track stitched (${normClips.length} clips)`);

  // Audio mix: voice + BGM ducked
  const audioMix = path.join(tmpDir, 'audio_mix.mp3');
  await execPromise(`"${FFMPEG_BIN}" -y -i "${voicePath}" -i "${bgmMp3}" -filter_complex "[0:a]volume=1.0[v];[1:a]volume=0.15[b];[v][b]amix=inputs=2:duration=first[out]" -map "[out]" -c:a libmp3lame -b:a 192k "${audioMix}"`);
  console.log(`  ✅ Audio mix: Voice + BGM`);

  // Final master clean (no captions/subtitles)
  const masterPath = path.join(outputDir, 'THE_LEGEND_OF_RAJA_2min.mp4');

  await execPromise(`"${FFMPEG_BIN}" -y -i "${videoTrack}" -i "${audioMix}" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "${masterPath}"`);

  if (fs.existsSync(masterPath)) {
    const sz = (fs.statSync(masterPath).size / 1024 / 1024).toFixed(2);
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║  🎉 "THE LEGEND OF RAJA" — PRODUCTION COMPLETE!          ║');
    console.log(`║  📁 ${masterPath}`);
    console.log(`║  📊 ${sz} MB | 16:9 | 1920×1080 | ~2 minutes             ║`);
    console.log(`║  🌐 http://localhost:5000/outputs/THE_LEGEND_OF_RAJA_2min.mp4`);
    console.log('╚═══════════════════════════════════════════════════════════╝');
  }
}

main().catch(e => { console.error('❌ FATAL:', e); process.exit(1); });
