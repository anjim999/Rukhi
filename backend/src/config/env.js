import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Dynamically search and load .env files across development and Hostinger production paths
const envCandidates = [
  path.resolve(process.cwd(), 'production.env'),
  path.resolve(process.cwd(), 'backend/production.env'),
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(process.cwd(), '.env'),
  '/home/u209580425/domains/rukhi.in/public_html/production.env',
  '/home/u209580425/domains/rukhi.in/public_html/backend/.env',
  '/home/u209580425/domains/rukhi.in/public_html/.env',
  '/home/u209580425/persistent_storage/production.env',
  '/home/u209580425/persistent_storage/.env',
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

if (!process.env.GEMINI_API_KEY && process.env.GCP_API_KEY) {
  process.env.GEMINI_API_KEY = process.env.GCP_API_KEY;
}
if (!process.env.GCP_API_KEY && process.env.GEMINI_API_KEY) {
  process.env.GCP_API_KEY = process.env.GEMINI_API_KEY;
}

const rawPort = process.env.PORT || '5000';

export const config = {
  port: isNaN(parseInt(rawPort, 10)) ? rawPort : parseInt(rawPort, 10),
  nodeEnv: process.env.NODE_ENV || 'production',

  // Database (Neon PostgreSQL) & Redis Cache
  dbUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || null,
  redis: {
    url: process.env.REDIS_URL || null,
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  // AI & Speech Keys
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  gcpApiKey: process.env.GCP_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || '',
  gcpProjectId: process.env.GCP_PROJECT_ID || '',
  gcpLocation: process.env.GCP_LOCATION || '',
  veoModel: process.env.VEO_MODEL || '',
  deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',

  // Directory Config
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads'),
  outputDir: path.resolve(process.cwd(), process.env.OUTPUT_DIR || 'outputs'),

  // Auth & Security
  jwtSecret: process.env.JWT_SECRET || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',

  // Cashfree Payment Gateway
  cashfreeAppId: process.env.CASHFREE_APP_ID || '',
  cashfreeSecretKey: process.env.CASHFREE_SECRET_KEY || '',
  cashfreeEnv: process.env.CASHFREE_ENV || 'PRODUCTION',

  // Email / SMTP Config
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    user: process.env.SMTP_USER || 'support@rukhi.in',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'support@rukhi.in',
  },
};

export default config;
