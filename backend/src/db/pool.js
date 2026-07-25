import https from 'https';
import pg from 'pg';
import { config } from '../config/env.js';

const { Pool } = pg;

// Parse Neon URL
function parseNeonUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    if (parsed.hostname.includes('neon.tech')) {
      return { isNeon: true, hostname: parsed.hostname, fullUrl: urlStr };
    }
  } catch (_e) {
    // fallback
  }
  return { isNeon: false };
}

const neonInfo = parseNeonUrl(config.dbUrl || '');

// Fallback pg Pool for standard/local databases
let fallbackPool = null;
if (!neonInfo.isNeon) {
  fallbackPool = new Pool({
    connectionString: config.dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
}

/**
 * Execute query via Neon HTTP API over HTTPS (family: 4 forces IPv4, bypassing ISP/firewall blocks).
 */
function queryNeonHttp(hostname, fullUrl, sql, params) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql, params });

    const req = https.request(
      {
        hostname,
        port: 443,
        path: '/sql',
        method: 'POST',
        family: 4, // FORCE IPv4 (bypasses IPv6 ENETUNREACH timeouts)
        headers: {
          'Neon-Connection-String': fullUrl,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const data = JSON.parse(body);
              resolve({
                rows: data.rows || [],
                rowCount: data.rows?.length || 0,
                fields: data.fields || [],
              });
            } catch (err) {
              reject(new Error(`Failed to parse Neon response: ${err.message}`));
            }
          } else {
            reject(new Error(`Neon HTTP Error ${res.statusCode}: ${body}`));
          }
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(15000, () => {
      req.destroy(new Error('Neon HTTP Request Timed Out'));
    });

    req.write(postData);
    req.end();
  });
}

export async function query(text, params = []) {
  const start = Date.now();

  if (neonInfo.isNeon) {
    const result = await queryNeonHttp(neonInfo.hostname, neonInfo.fullUrl, text, params);
    const duration = Date.now() - start;

    if (config.nodeEnv === 'development') {
      console.log('[NEON HTTP SUCCESS]', { text: text.substring(0, 60), duration: `${duration}ms`, rows: result.rowCount });
    }

    return result;
  }

  const result = await fallbackPool.query(text, params);
  const duration = Date.now() - start;

  if (config.nodeEnv === 'development') {
    console.log('[DB QUERY SUCCESS]', { text: text.substring(0, 60), duration: `${duration}ms`, rows: result.rowCount });
  }

  return result;
}

export async function getClient() {
  if (neonInfo.isNeon) {
    return {
      query: (text, params) => query(text, params),
      release: () => {},
    };
  }
  return fallbackPool.connect();
}

export async function closePool() {
  if (fallbackPool) {
    await fallbackPool.end();
  }
}

export default { query, getClient, closePool };
