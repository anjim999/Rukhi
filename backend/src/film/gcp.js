import fs from 'fs';
import crypto from 'crypto';
import { KEY_PATH } from './paths.js';

let key = null;
let cachedToken = null;
let tokenExpiry = 0;

export function getKey() {
  if (!key) {
    if (!fs.existsSync(KEY_PATH)) {
      throw new Error(`GCP service-account key not found at ${KEY_PATH}`);
    }
    key = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  }
  return key;
}

/**
 * Mint (and cache) a service-account access token. Re-minted 5 minutes before expiry,
 * so multi-hour runs never outlive their token.
 */
export async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && tokenExpiry > now + 300) return cachedToken;

  const k = getKey();
  const tokenUri = k.token_uri || 'https://oauth2.googleapis.com/token';
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim = Buffer.from(JSON.stringify({
    iss: k.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: tokenUri,
    exp: now + 3600,
    iat: now,
  })).toString('base64url');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${claim}`);
  const jwt = `${header}.${claim}.${signer.sign(k.private_key, 'base64url')}`;

  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`GCP token exchange failed (HTTP ${res.status}): ${JSON.stringify(data).slice(0, 300)}`);
  }
  cachedToken = data.access_token;
  tokenExpiry = now + (data.expires_in || 3600);
  return cachedToken;
}

export function modelUrl(model, method, location = 'us-central1') {
  const project = getKey().project_id;
  // The global endpoint has no region prefix on the host.
  const host = location === 'global' ? 'aiplatform.googleapis.com' : `${location}-aiplatform.googleapis.com`;
  return `https://${host}/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:${method}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * POST JSON to a Google API with bearer auth. Retries 429/5xx and network errors with backoff;
 * 4xx errors are thrown immediately with the response body attached.
 */
export async function postJson(url, body, { retries = 5, timeoutMs = 180000, method = 'POST' } = {}) {
  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    // Rate limits (429) are per-minute quotas, so they need a much longer wait than a transient 5xx.
    const base = lastErr?.status === 429 ? 15000 : 2000;
    if (attempt > 0) await sleep(Math.min(90000, base * 2 ** (attempt - 1)));
    try {
      const token = await getAccessToken();
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
          // Bills and quota-checks non-Vertex Google APIs (Text-to-Speech) against the key's own project.
          'x-goog-user-project': getKey().project_id,
        },
        ...(method === 'GET' ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const text = await res.text();
      if (res.ok) return text ? JSON.parse(text) : {};

      const err = new Error(`HTTP ${res.status} from ${url.split('/models/')[1] || url}: ${text.slice(0, 600)}`);
      err.status = res.status;
      err.body = text;
      if (res.status === 401) cachedToken = null;
      if (![401, 429, 500, 502, 503, 504].includes(res.status)) throw err;
      lastErr = err;
    } catch (err) {
      if (err.status && ![401, 429, 500, 502, 503, 504].includes(err.status)) throw err;
      lastErr = err;
    }
  }
  throw lastErr;
}

/** Download an object the service account can read, from a gs:// URI. */
export async function downloadGcs(uri) {
  const [bucket, ...rest] = uri.replace('gs://', '').split('/');
  const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(rest.join('/'))}?alt=media`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${await getAccessToken()}` } });
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${uri}: ${(await res.text()).slice(0, 300)}`);
  return Buffer.from(await res.arrayBuffer());
}
