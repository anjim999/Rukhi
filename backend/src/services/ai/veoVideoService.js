import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { config } from '../../config/env.js';
import { runFFmpeg } from '../media/ffmpegService.js';

/**
 * Generate GCP OAuth 2.0 Access Token from Service Account Key JSON
 */
async function getGcpAccessToken() {
  if (process.env.GCP_ACCESS_TOKEN) return process.env.GCP_ACCESS_TOKEN;

  const keyCandidatePaths = [
    path.resolve(process.cwd(), 'gcp_key.json'),
    path.resolve(process.cwd(), 'backend/gcp_key.json'),
    '/home/u209580425/gcp_key.json',
  ];

  let activeKeyPath = null;
  for (const p of keyCandidatePaths) {
    if (fs.existsSync(p)) {
      activeKeyPath = p;
      break;
    }
  }

  if (!activeKeyPath) return null;

  try {
    const keyData = JSON.parse(fs.readFileSync(activeKeyPath, 'utf-8'));
    const now = Math.floor(Date.now() / 1000);

    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claimSet = Buffer.from(JSON.stringify({
      iss: keyData.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/generative-language https://www.googleapis.com/auth/generative-language.retriever',
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

    if (res.ok) {
      const data = await res.json();
      console.log(`[VEO SERVICE] 🔑 Minted GCP OAuth 2.0 Access Token from Service Account JSON (${keyData.client_email})!`);
      return data.access_token;
    } else {
      const errTxt = await res.text();
      console.warn(`[VEO SERVICE WARN] GCP Token exchange notice: ${errTxt}`);
    }
  } catch (err) {
    console.warn(`[VEO SERVICE WARN] Failed to load Service Account JSON: ${err.message}`);
  }
  return null;
}


/**
 * Veo & Vertex AI Video Generation Service
 * Implements Image-to-Video generation with Last-Frame Continuation (`clip[N-1]` end frame -> `clip[N]` start image)
 * for 100% continuous character, pose, and background matching across scenes.
 */

export async function generateVeoVideoClip({
  scenePrompt,
  startImagePath,
  outputVideoPath,
  aspectRatio = '9:16',
  durationSeconds = 5.0,
}) {
  const apiKey = config.gcpApiKey || config.geminiApiKey;
  if (!apiKey && !config.gcpProjectId) {
    throw new Error('Gemini API Key or GCP Project ID is required for Veo Video Generation.');
  }

  console.log(`[VEO VERTEX AI SERVICE] Generating ${durationSeconds}s scene clip...`);
  console.log(`[VEO VERTEX AI SERVICE] Prompt: "${scenePrompt.substring(0, 75)}..."`);

  // Ensure target output directory exists
  const outputDir = path.dirname(outputVideoPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let startImageBase64 = null;
  if (startImagePath && fs.existsSync(startImagePath)) {
    try {
      const imageBuffer = fs.readFileSync(startImagePath);
      startImageBase64 = imageBuffer.toString('base64');
      console.log(`[VEO VERTEX AI SERVICE] 🔗 Last-Frame Continuation enabled! Seed image buffer: ${startImagePath} (${imageBuffer.length} bytes)`);
    } catch (err) {
      console.warn(`[VEO VERTEX AI SERVICE WARN] Failed to read seed image ${startImagePath}: ${err.message}`);
    }
  }

  // Attempt Google Cloud Vertex AI Veo Video Generation API
  try {
    const videoResult = await callVertexAiVeoApi({
      scenePrompt,
      startImageBase64,
      aspectRatio,
      durationSeconds,
    });

    if (videoResult && videoResult.videoBuffer) {
      fs.writeFileSync(outputVideoPath, videoResult.videoBuffer);
      console.log(`[VEO VERTEX AI SERVICE] ✅ Successfully generated and saved Veo video clip: ${outputVideoPath}`);
      return outputVideoPath;
    }
  } catch (apiErr) {
    console.error(`[VEO VERTEX AI SERVICE API ERROR] ❌ Veo 3.1 endpoint failed: ${apiErr.message}`);
    throw new Error(`Google Vertex AI Veo 3.1 Error: ${apiErr.message}`);
  }

  throw new Error('Google Vertex AI Veo 3.1 returned empty video response.');
}

/**
 * Calls Google Cloud Vertex AI Veo 3.1 REST Endpoint (:predictLongRunning & :fetchPredictOperation)
 */
async function callVertexAiVeoApi({ scenePrompt, startImageBase64, aspectRatio, durationSeconds }) {
  const apiKey = config.gcpApiKey || config.geminiApiKey;
  const gcpAccessToken = (await getGcpAccessToken()) || process.env.GCP_ACCESS_TOKEN || process.env.VERTEX_ACCESS_TOKEN;

  const veoModel = config.veoModel || 'veo-3.1-lite-generate-001';
  const gcpProjectId = config.gcpProjectId || process.env.GCP_PROJECT_ID || 'ai-quiz-generator-479518';
  const gcpLocation = config.gcpLocation || process.env.GCP_LOCATION || 'us-central1';

  // Verified Google Veo 3.1 GA PredictLongRunning Endpoints
  const candidateEndpoints = [
    `https://${gcpLocation}-aiplatform.googleapis.com/v1/projects/${gcpProjectId}/locations/${gcpLocation}/publishers/google/models/veo-3.1-lite-generate-001:predictLongRunning`,
    `https://${gcpLocation}-aiplatform.googleapis.com/v1/projects/${gcpProjectId}/locations/${gcpLocation}/publishers/google/models/veo-3.1-generate-001:predictLongRunning`,
  ];
  
  const gcsBucketUri = 'gs://rukhi-bucket';

  const payload = {
    instances: [
      {
        prompt: `${scenePrompt}, high-definition ${aspectRatio} vertical reel, hyper-realistic motion, broadcast production quality`,
        ...(startImageBase64 ? { image: { bytesBase64Encoded: startImageBase64, mimeType: 'image/jpeg' } } : {}),
      },
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio,
      durationSeconds: 6, // Google Veo 3.1 supported durations are strictly [4, 6, 8]
      storageUri: gcsBucketUri,
    },
  };

  let lastError = null;

  for (const endpointUrl of candidateEndpoints) {
    try {
      const headers = {
        'Content-Type': 'application/json; charset=utf-8',
      };
      if (gcpAccessToken) {
        headers['Authorization'] = `Bearer ${gcpAccessToken}`;
      } else if (apiKey) {
        headers['X-Goog-Api-Key'] = apiKey;
      }

      const targetModel = endpointUrl.includes('veo-3.1-lite') ? 'veo-3.1-lite-generate-001' : 'veo-3.1-generate-001';
      console.log(`[VEO 3.1 API] Requesting ${targetModel} via endpoint: ${endpointUrl}`);
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = new Error(`HTTP ${response.status}: ${errText}`);
        console.error(`[VEO 3.1 API ERROR] Endpoint returned HTTP ${response.status}:\n${errText}`);
        continue;
      }

      const data = await response.json();

      // If Long-Running Operation returned (Veo 3 spec)
      if (data.name) {
        console.log(`[VEO 3.1 API] 🚀 Initiated Long-Running Operation: ${data.name}`);
        return await pollVeoOperation(data.name, gcpAccessToken, apiKey, gcpProjectId, gcpLocation, veoModel);
      }

      // If direct base64 video predictions returned
      if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
        return {
          videoBuffer: Buffer.from(data.predictions[0].bytesBase64Encoded, 'base64'),
        };
      }
    } catch (err) {
      console.error(`[VEO 3.1 REQUEST EXCEPTION] ${err.message}`);
      lastError = err;
    }
  }

  throw lastError || new Error('Unexpected Veo API response format.');
}

/**
 * Polls Long-Running Operation for Vertex AI Veo 3.1 Generation (:fetchPredictOperation)
 */
async function pollVeoOperation(operationName, gcpAccessToken, apiKey, gcpProjectId, gcpLocation, veoModel) {
  const modelToPoll = operationName.includes('veo-3.1-lite') ? 'veo-3.1-lite-generate-001' : (operationName.includes('veo-3.1') ? 'veo-3.1-generate-001' : 'veo-3.1-lite-generate-001');
  const fetchUrl = `https://${gcpLocation}-aiplatform.googleapis.com/v1/projects/${gcpProjectId}/locations/${gcpLocation}/publishers/google/models/${modelToPoll}:fetchPredictOperation`;
  const maxAttempts = 30; // 30 x 4s = 120s max
  let attempts = 0;

  const headers = { 'Content-Type': 'application/json; charset=utf-8' };
  if (gcpAccessToken) {
    headers['Authorization'] = `Bearer ${gcpAccessToken}`;
  } else if (apiKey) {
    headers['X-Goog-Api-Key'] = apiKey;
  }

  while (attempts < maxAttempts) {
    attempts++;
    await new Promise((r) => setTimeout(r, 4000));

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ operationName }),
      });

      if (!response.ok) {
        const errTxt = await response.text();
        console.warn(`[VEO POLL WARN] Attempt ${attempts}/${maxAttempts} - HTTP ${response.status}: ${errTxt}`);
        continue;
      }

      const data = await response.json();
      if (data.done) {
        if (data.error) {
          console.error(`[VEO POLL ERROR] Operation completed with error:\n${JSON.stringify(data.error, null, 2)}`);
          throw new Error(`Veo 3.1 task error: ${data.error.message || JSON.stringify(data.error)}`);
        }

        const videoObj = data.response?.videos?.[0] || data.response?.generatedVideos?.[0]?.video || data.response?.predictions?.[0];
        if (videoObj) {
          if (videoObj.bytesBase64Encoded) {
            return { videoBuffer: Buffer.from(videoObj.bytesBase64Encoded, 'base64') };
          }
          const uri = videoObj.gcsUri || videoObj.uri;
          if (uri) {
            if (uri.startsWith('gs://')) {
              const parts = uri.replace('gs://', '').split('/');
              const bucket = parts.shift();
              const objectPath = encodeURIComponent(parts.join('/'));
              const gcsUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${objectPath}?alt=media`;
              console.log(`[VEO SERVICE] 📥 Downloading generated video from GCS: ${uri}`);
              const videoRes = await fetch(gcsUrl, {
                headers: gcpAccessToken ? { Authorization: `Bearer ${gcpAccessToken}` } : {},
              });
              if (videoRes.ok) {
                const arrayBuffer = await videoRes.arrayBuffer();
                console.log(`[VEO SERVICE] ✅ Downloaded Veo video clip (${arrayBuffer.byteLength} bytes) from GCS!`);
                return { videoBuffer: Buffer.from(arrayBuffer) };
              } else {
                const errTxt = await videoRes.text();
                console.error(`[VEO GCS DOWNLOAD ERROR] Failed to download GCS video ${uri}: HTTP ${videoRes.status} ${errTxt}`);
                throw new Error(`Failed to download GCS video ${uri}: HTTP ${videoRes.status} ${errTxt}`);
              }
            } else if (uri.startsWith('http')) {
              const videoRes = await fetch(uri);
              const arrayBuffer = await videoRes.arrayBuffer();
              return { videoBuffer: Buffer.from(arrayBuffer) };
            }
          }
        }
      }
    } catch (pollErr) {
      if (pollErr.message && pollErr.message.includes('Veo 3.1 task error')) {
        throw pollErr;
      }
      console.warn(`[VEO POLL EXCEPTION] Attempt ${attempts}/${maxAttempts}: ${pollErr.message}`);
    }
  }

  throw new Error('Veo 3.1 video generation operation timed out after 120s.');
}


