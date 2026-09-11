import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const FFMPEG_BIN = path.resolve('backend/node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe');
const KEY_PATH = path.resolve('backend/gcp_key.json');
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

async function renderVeoClip(token, imagePath, prompt, outPath) {
  const projectId = keyData.project_id;
  const location = 'us-central1';
  const model = 'veo-3.1-lite-generate-001';

  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 500000) {
    console.log(`  Reusing existing Veo video: ${path.basename(outPath)}`);
    return true;
  }

  const imgBase64 = fs.readFileSync(imagePath).toString('base64');
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predictLongRunning`;

  console.log(`  🚀 Launching Veo 3.1 video render for: ${path.basename(imagePath)}...`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [{
        prompt,
        image: {
          bytesBase64Encoded: imgBase64,
          mimeType: 'image/png'
        }
      }],
      parameters: {
        aspectRatio: '16:9',
        durationSeconds: 6,
        sampleCount: 1
      }
    })
  });

  const data = await res.json();
  if (!data.name) {
    console.error('Launch failed:', data);
    return false;
  }

  const opName = data.name;
  const fetchUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:fetchPredictOperation`;

  for (let i = 1; i <= 25; i++) {
    await new Promise(r => setTimeout(r, 6000));
    process.stdout.write(`.`);

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
      console.log(' Done!');
      const videoObj = pollData.response?.videos?.[0] || pollData.response?.generatedVideos?.[0]?.video || pollData.response?.predictions?.[0];
      if (videoObj?.bytesBase64Encoded) {
        const buf = Buffer.from(videoObj.bytesBase64Encoded, 'base64');
        fs.writeFileSync(outPath, buf);
        console.log(`  ✅ Saved Veo Video: ${path.basename(outPath)} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
        return true;
      }
      return false;
    }
  }
  return false;
}

async function main() {
  console.log('================================================================');
  console.log('🎥 RENDERING PURE GOOGLE VEO 3.1 AI VIDEO MOVIE SEQUENCE');
  console.log('================================================================\n');

  const uploadDir = path.resolve('uploads');
  const token = await getAccessToken();

  const scenes = [
    {
      name: 'veo_scene1_walk.mp4',
      image: path.join(uploadDir, 'proposal_scene_1.png'),
      prompt: 'Cinematic moving camera: The handsome young man in navy coat and beautiful young woman in blush trench coat walking forward together on the grassy cliffside path at sunset, warm wind blowing her wavy hair and coats, realistic physical body movement, smooth camera tracking shot, 4k photorealistic'
    },
    {
      name: 'veo_scene2_holdhands.mp4',
      image: path.join(uploadDir, 'proposal_scene_5.png'),
      prompt: 'Cinematic close medium shot: The young man gently taking both of the young woman hands, speaking to her with deep warmth and romance, she smiles lovingly, soft golden sunset glow reflecting on their faces, natural breathing and hair movement in mountain breeze'
    },
    {
      name: 'veo_proposal_scene7.mp4', // Already rendered!
      image: path.join(uploadDir, 'proposal_scene_7.png'),
      prompt: 'Already rendered proposal scene'
    },
    {
      name: 'veo_scene4_embrace.mp4',
      image: path.join(uploadDir, 'proposal_scene_10.png'),
      prompt: 'Epic cinematic drone shot: The young man and woman pulling into a warm emotional loving embrace, wrapping their arms around each other on the mountain hill station, camera slowly orbiting around them revealing the breathtaking sunset panorama'
    }
  ];

  const renderedClips = [];

  for (const sc of scenes) {
    const outPath = path.join(uploadDir, sc.name);
    console.log(`🎬 Processing ${sc.name}...`);
    const ok = await renderVeoClip(token, sc.image, sc.prompt, outPath);
    if (ok && fs.existsSync(outPath)) {
      renderedClips.push(outPath);
    }
  }

  console.log('\nStitching pure Veo 3.1 video sequence...');
  const concatList = path.join(uploadDir, 'veo_concat_list.txt');
  fs.writeFileSync(concatList, renderedClips.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n'));

  const masterVeoMovie = path.join(uploadDir, 'veo_proposal_movie_full.mp4');
  const concatCmd = `"${FFMPEG_BIN}" -y -f concat -safe 0 -i "${concatList}" -c copy "${masterVeoMovie}"`;
  await execPromise(concatCmd);

  console.log(`\n🎉 PURE GOOGLE VEO 3.1 MOVIE SCENE COMPLETE!`);
  console.log(`📁 File: ${masterVeoMovie}`);
  console.log(`📊 Size: ${(fs.statSync(masterVeoMovie).size / 1024 / 1024).toFixed(2)} MB`);

  try {
    exec(`Start-Process "${masterVeoMovie}"`);
    exec(`explorer.exe /select,"${masterVeoMovie}"`);
  } catch (_) {}
}

main().catch(console.error);
