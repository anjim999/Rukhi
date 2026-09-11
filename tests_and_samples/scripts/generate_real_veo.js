import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const keyPath = path.resolve('backend/gcp_key.json');
const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));

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

async function generateVeoVideo() {
  const token = await getAccessToken();
  const projectId = keyData.project_id;
  const location = 'us-central1';
  const model = 'veo-3.1-lite-generate-001';

  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predictLongRunning`;
  console.log(`\n🚀 Launching Google Veo 3.1 video generation (duration: 6s, aspect: 16:9)...`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [
        { prompt: 'A glowing cybernetic banana riding a neon skateboard smoothly down a rainy Tokyo street at night, cinematic 8k photorealistic motion, neon reflections on wet asphalt' }
      ],
      parameters: {
        aspectRatio: '16:9',
        durationSeconds: 6,
        sampleCount: 1
      }
    })
  });

  const data = await res.json();
  console.log(`[Veo 3.1 Launch Status]: ${res.status}`);
  console.log(`Operation Name:`, data.name);

  if (!data.name) {
    console.error('Launch failed:', data);
    return;
  }

  const opName = data.name;
  const fetchUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:fetchPredictOperation`;

  console.log('\n⏳ Waiting for Veo 3.1 neural video renderer to finish (usually ~45-90 seconds)...');
  for (let attempt = 1; attempt <= 30; attempt++) {
    await new Promise(r => setTimeout(r, 6000));
    process.stdout.write(`Attempt ${attempt}... `);

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
      console.log('\n🎉 Veo 3.1 Video Render Complete!');
      if (pollData.error) {
        console.error('Veo render error:', pollData.error);
        return;
      }

      const videoObj = pollData.response?.videos?.[0] || pollData.response?.generatedVideos?.[0]?.video || pollData.response?.predictions?.[0];
      if (videoObj?.bytesBase64Encoded) {
        const buf = Buffer.from(videoObj.bytesBase64Encoded, 'base64');
        const outPath = 'uploads/veo_cyber_banana_6s.mp4';
        fs.writeFileSync(outPath, buf);
        console.log(`✅ SAVED VEO VIDEO CLIP to ${outPath} (${(buf.length / 1024 / 1024).toFixed(2)} MB)!`);
        return;
      } else if (videoObj?.uri) {
        console.log('Video output GCS URI:', videoObj.uri);
      }
      return;
    }
  }
}

generateVeoVideo().catch(console.error);
