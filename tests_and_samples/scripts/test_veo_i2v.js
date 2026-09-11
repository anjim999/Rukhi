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

async function testVeoI2V() {
  const token = await getAccessToken();
  const projectId = keyData.project_id;
  const location = 'us-central1';
  const model = 'veo-3.1-lite-generate-001';

  const imagePath = path.resolve('uploads/proposal_scene_7.png');
  if (!fs.existsSync(imagePath)) {
    console.error('proposal_scene_7.png not found');
    return;
  }
  const imgBase64 = fs.readFileSync(imagePath).toString('base64');

  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predictLongRunning`;
  console.log(`🚀 Sending Image-to-Video request to Google Veo 3.1 (${imagePath})...`);

  const payload = {
    instances: [
      {
        prompt: 'Cinematic movie scene: The young man in navy coat is on one knee holding up the sparkling diamond engagement ring to the emotional young woman in pastel coat, mountain breeze blowing through her hair, she gasps with tears of joy, golden sunset lighting, slow camera motion, 4k photorealistic',
        image: {
          bytesBase64Encoded: imgBase64,
          mimeType: 'image/png'
        }
      }
    ],
    parameters: {
      aspectRatio: '16:9',
      durationSeconds: 6,
      sampleCount: 1
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  console.log('Launch HTTP Status:', res.status);
  const data = await res.json();
  console.log('Launch response:', JSON.stringify(data, null, 2));

  if (!data.name) return;

  const opName = data.name;
  const fetchUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:fetchPredictOperation`;

  console.log('Waiting for Google Veo 3.1 video render...');
  for (let i = 1; i <= 30; i++) {
    await new Promise(r => setTimeout(r, 6000));
    process.stdout.write(`Attempt ${i}... `);

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
        console.error('Render error:', pollData.error);
        return;
      }

      const videoObj = pollData.response?.videos?.[0] || pollData.response?.generatedVideos?.[0]?.video || pollData.response?.predictions?.[0];
      if (videoObj?.bytesBase64Encoded) {
        const buf = Buffer.from(videoObj.bytesBase64Encoded, 'base64');
        const outPath = 'uploads/veo_proposal_scene7.mp4';
        fs.writeFileSync(outPath, buf);
        console.log(`✅ SAVED REAL VEO VIDEO to ${outPath} (${(buf.length / 1024 / 1024).toFixed(2)} MB)!`);
      }
      return;
    }
  }
}

testVeoI2V().catch(console.error);
