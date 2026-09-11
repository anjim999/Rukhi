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
  if (!res.ok) {
    throw new Error('OAuth Error: ' + JSON.stringify(data));
  }
  return data.access_token;
}

async function run() {
  console.log('Minting OAuth token for:', keyData.client_email);
  const token = await getAccessToken();
  console.log('Got OAuth Access Token! Length:', token.length);

  const projectId = keyData.project_id;
  const location = 'us-central1';

  // Test candidate models on Vertex AI:
  // Gemini 3.1 Flash Image / Nano Banana Pro / Imagen
  const candidateModels = [
    'nano-banana-pro-preview',
    'gemini-3.1-flash-image',
    'gemini-3-pro-image',
    'gemini-2.5-flash-image',
    'imagen-3.0-generate-002',
    'imagen-3.0-fast-generate-001'
  ];

  for (const model of candidateModels) {
    console.log(`\n--- Testing Vertex AI model: ${model} ---`);

    // First try generateContent
    const genUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
    try {
      const res = await fetch(genUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: 'A glowing cybernetic nano banana with gold and neon accents, futuristic 8k studio product photography' }]
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
          }
        })
      });

      const json = await res.json();
      console.log(`[${model} :generateContent] HTTP ${res.status}`);
      if (res.ok) {
        console.log('SUCCESS with generateContent!');
        const parts = json.candidates?.[0]?.content?.parts || [];
        const imgPart = parts.find(p => p.inlineData);
        if (imgPart) {
          const imgBuffer = Buffer.from(imgPart.inlineData.data, 'base64');
          const outPath = `uploads/nano_banana_${model}.png`;
          fs.writeFileSync(outPath, imgBuffer);
          console.log(`✅ SAVED GENERATED IMAGE to ${outPath} (${imgBuffer.length} bytes)!`);
          return;
        } else {
          console.log('Response parts:', parts);
        }
      } else {
        console.log('Error details:', json.error?.message?.slice(0, 150));
      }
    } catch (e) {
      console.log('Exception in generateContent:', e.message);
    }

    // Also try :predict (standard for Imagen on Vertex AI)
    const predictUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;
    try {
      const res = await fetch(predictUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [
            { prompt: 'A glowing cybernetic nano banana with gold and neon accents, futuristic 8k studio product photography' }
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1'
          }
        })
      });

      const json = await res.json();
      console.log(`[${model} :predict] HTTP ${res.status}`);
      if (res.ok) {
        console.log('SUCCESS with predict!');
        const predictions = json.predictions || [];
        if (predictions[0]?.bytesBase64Encoded) {
          const imgBuffer = Buffer.from(predictions[0].bytesBase64Encoded, 'base64');
          const outPath = `uploads/nano_banana_${model}.png`;
          fs.writeFileSync(outPath, imgBuffer);
          console.log(`✅ SAVED GENERATED IMAGE to ${outPath} (${imgBuffer.length} bytes)!`);
          return;
        }
      } else {
        console.log('Error details:', json.error?.message?.slice(0, 150));
      }
    } catch (e) {
      console.log('Exception in predict:', e.message);
    }
  }
}

run().catch(console.error);
