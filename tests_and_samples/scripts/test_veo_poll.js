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

async function checkOp() {
  const token = await getAccessToken();
  const projectId = keyData.project_id;
  const location = 'us-central1';
  const model = 'veo-3.1-lite-generate-001';
  const fetchUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:fetchPredictOperation`;
  const opName = 'projects/ai-quiz-generator-479518/locations/us-central1/publishers/google/models/veo-3.1-lite-generate-001/operations/727d533f-66c6-40bf-b5df-6f3fa492d6b3';

  console.log('Fetching operation status...');
  const res = await fetch(fetchUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ operationName: opName })
  });

  console.log('HTTP Status:', res.status);
  const data = await res.json();
  console.log('Data:', JSON.stringify(data, null, 2).slice(0, 1000));
  
  if (data.done) {
    console.log('Done is true!');
    const videoObj = data.response?.videos?.[0] || data.response?.generatedVideos?.[0]?.video || data.response?.predictions?.[0];
    if (videoObj?.bytesBase64Encoded) {
      const buf = Buffer.from(videoObj.bytesBase64Encoded, 'base64');
      fs.writeFileSync('uploads/veo_cyber_banana.mp4', buf);
      console.log(`✅ SAVED VEO VIDEO to uploads/veo_cyber_banana.mp4 (${buf.length} bytes)!`);
    } else if (videoObj?.uri) {
      console.log('GCS URI:', videoObj.uri);
    }
  }
}

checkOp().catch(console.error);
