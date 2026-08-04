import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';

let cachedToken = null;
let tokenExpiry = 0;

/**
 * Robust IPv4 fetch helper using Node https module with family: 4.
 * Prevents undici IPv6 ETIMEDOUT errors on Linux local networks when fetching Google OAuth / Vertex AI APIs.
 */
function ipv4Fetch(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(urlStr);
      const reqOptions = {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method: options.method || 'GET',
        family: 4,
        headers: options.headers || {},
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: async () => JSON.parse(data),
            text: async () => data,
          });
        });
      });

      req.on('error', (err) => reject(err));
      if (options.body) req.write(options.body);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Mint OAuth 2.0 GCP Bearer token using Service Account JSON (gcp_key.json).
 * Caches token in memory for 1 hour.
 */
export async function getGcpAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && tokenExpiry > now + 300) {
    return cachedToken;
  }

  const keyCandidatePaths = [
    path.resolve(process.cwd(), 'gcp_key.json'),
    path.resolve(process.cwd(), 'backend/gcp_key.json'),
    '/home/u209580425/gcp_key.json',
  ];

  let keyPath = null;
  for (const p of keyCandidatePaths) {
    if (fs.existsSync(p)) {
      keyPath = p;
      break;
    }
  }

  if (!keyPath) {
    console.warn('[VERTEX AI AUTH WARN] gcp_key.json not found in candidate paths.');
    return null;
  }

  try {
    const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claim = Buffer.from(JSON.stringify({
      iss: key.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: key.token_uri,
      exp: now + 3600,
      iat: now,
    })).toString('base64url');

    const signatureInput = `${header}.${claim}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureInput);
    const signature = signer.sign(key.private_key, 'base64url');
    const jwt = `${signatureInput}.${signature}`;

    const tokenRes = await ipv4Fetch(key.token_uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenRes.json();
    if (tokenData.access_token) {
      cachedToken = tokenData.access_token;
      tokenExpiry = now + (tokenData.expires_in || 3600);
      console.log('[VERTEX AI AUTH] 🎉 Successfully minted GCP OAuth Bearer Token via Service Account!');
      return cachedToken;
    } else {
      console.warn('[VERTEX AI AUTH WARN] Token endpoint returned no access_token:', tokenData);
    }
  } catch (err) {
    console.warn('[VERTEX AI AUTH WARN] Failed to mint GCP access token:', err.message);
  }

  return null;
}

/**
 * Execute Gemini model generateContent call via Google Vertex AI (aiplatform.googleapis.com).
 * Covered 100% by GCP $300 Free Trial credits.
 */
export async function generateContentViaVertexAi({ model = 'gemini-2.5-flash', contents, generationConfig = {} }) {
  const token = await getGcpAccessToken();
  if (!token) return null;

  let projectId = 'ai-quiz-generator-479518';
  const keyCandidatePaths = [
    path.resolve(process.cwd(), 'gcp_key.json'),
    path.resolve(process.cwd(), 'backend/gcp_key.json'),
    '/home/u209580425/gcp_key.json',
  ];
  for (const p of keyCandidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const key = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (key.project_id) projectId = key.project_id;
      } catch (_) {}
      break;
    }
  }

  const isGlobalModel = model.includes('3.1') || model.includes('preview') || model.includes('thinking');
  const location = isGlobalModel ? 'global' : 'us-central1';

  // Format parts array for Vertex AI REST API
  const formattedParts = [];
  if (Array.isArray(contents)) {
    for (const item of contents) {
      if (typeof item === 'string') {
        formattedParts.push({ text: item });
      } else if (item.inlineData) {
        formattedParts.push({
          inlineData: {
            mimeType: item.inlineData.mimeType || 'audio/wav',
            data: item.inlineData.data,
          },
        });
      } else if (item.text) {
        formattedParts.push({ text: item.text });
      }
    }
  } else if (typeof contents === 'string') {
    formattedParts.push({ text: contents });
  }

  const endpoint = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

  try {
    console.log(`[VERTEX AI GEMINI] 🚀 Executing ${model} via Vertex AI REST (${location} endpoint, GCP Cloud Credits)...`);
    const response = await ipv4Fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: formattedParts }],
        generationConfig: {
          temperature: generationConfig.temperature ?? 0.1,
          maxOutputTokens: generationConfig.maxOutputTokens || 8192,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[VERTEX AI GEMINI WARN] Status ${response.status}: ${errorText.substring(0, 250)}`);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // Extract real usageMetadata from Vertex AI response
    if (data.usageMetadata) {
      const { promptTokenCount = 0, candidatesTokenCount = 0, totalTokenCount = 0 } = data.usageMetadata;
      console.log(`[VERTEX AI TELEMETRY] ${model} Tokens - Prompt: ${promptTokenCount} | Output: ${candidatesTokenCount} | Total: ${totalTokenCount}`);
      
      if (generationConfig.generationId) {
        import('../studio/productionLedgerService.js').then(({ productionLedgerService }) => {
          productionLedgerService.recordGeminiUsage({
            generationId: generationConfig.generationId,
            model,
            inputTokens: promptTokenCount,
            outputTokens: candidatesTokenCount
          }).catch(() => {});
        });
      }
    }

    if (text && text.trim().length > 0) {
      console.log(`[VERTEX AI GEMINI] ✅ ${model} generateContent succeeded via Vertex AI!`);
      return text;
    }
  } catch (err) {
    console.warn(`[VERTEX AI GEMINI ERROR] Failed call to ${model}:`, err.message);
  }

  return null;
}
