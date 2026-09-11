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

async function testVeo() {
  const token = await getAccessToken();
  const projectId = keyData.project_id;
  const location = 'us-central1';
  const m = 'veo-3.1-lite-generate-001';

  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${m}:predictLongRunning`;
  console.log(`\nTesting Veo model: ${m} with 16:9 aspect ratio...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          { prompt: 'A glowing cybernetic banana riding a neon skateboard down a rainy Tokyo street at night, cinematic 8k, slow motion' }
        ],
        parameters: {
          aspectRatio: '16:9',
          durationSeconds: 5,
          sampleCount: 1
        }
      })
    });
    const data = await res.json();
    console.log(`[${m}] Status: ${res.status}`);
    console.log(`[${m}] Response:`, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`[${m}] Error:`, e.message);
  }
}

testVeo().catch(console.error);
