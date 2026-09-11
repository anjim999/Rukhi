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

async function testConsistentCharacter() {
  const token = await getAccessToken();
  const projectId = keyData.project_id;
  const location = 'us-central1';

  // Use the banana we generated as reference image!
  const refPath = 'uploads/nano_banana_gemini-2.5-flash-image.png';
  if (!fs.existsSync(refPath)) {
    console.error('Reference image not found!');
    return;
  }
  const refBase64 = fs.readFileSync(refPath).toString('base64');

  const vertexUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash-image:generateContent`;

  console.log('Testing Scene 2 with consistent character reference...');
  const res = await fetch(vertexUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: refBase64,
            }
          },
          {
            text: 'Keep the exact same cybernetic banana character from the reference image, but now place it riding a futuristic neon skateboard in a rainy Tokyo street at night, 8k cinematic shot.'
          }
        ]
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE']
      }
    })
  });

  console.log('Status:', res.status);
  const json = await res.json();
  if (res.ok) {
    const parts = json.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData);
    if (imgPart) {
      const imgBuffer = Buffer.from(imgPart.inlineData.data, 'base64');
      const outPath = 'uploads/consistent_character_scene2.png';
      fs.writeFileSync(outPath, imgBuffer);
      console.log(`✅ SUCCESS! Saved consistent character Scene 2 to ${outPath} (${imgBuffer.length} bytes)!`);
    } else {
      console.log('No image in parts:', parts);
    }
  } else {
    console.error('Error:', json.error);
  }
}

testConsistentCharacter().catch(console.error);
