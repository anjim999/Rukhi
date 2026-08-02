import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Dynamically search and load .env files across development and Hostinger production paths
const envCandidates = [
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(process.cwd(), '.env'),
  '/home/u209580425/domains/rukhi.in/public_html/backend/.env',
  '/home/u209580425/domains/rukhi.in/public_html/.env',
  '/home/u209580425/persistent_storage/.env',
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

const isHostinger = fs.existsSync('/home/u209580425') || process.cwd().includes('u209580425') || process.cwd().includes('rukhi.in');
const rawPort = process.env.PORT || '5000';

export const config = {
  port: isNaN(parseInt(rawPort, 10)) ? rawPort : parseInt(rawPort, 10),
  nodeEnv: process.env.NODE_ENV || 'production',

  // Database & Cache (Neon PostgreSQL & Redis)
  dbUrl: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL,
  redisUrl: process.env.REDIS_URL || null,

  // AI Service Keys
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GCP_API_KEY || '',
  gcpApiKey: process.env.GCP_API_KEY || process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  gcpProjectId: process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'ai-quiz-generator-479518',
  gcpLocation: process.env.GCP_LOCATION || 'us-central1',
  veoModel: process.env.VEO_MODEL || 'veo-3.1-lite-generate-001',
  deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
  pexelsApiKey: process.env.PEXELS_API_KEY || '',

  // Directory Config
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads'),
  outputDir: path.resolve(process.cwd(), process.env.OUTPUT_DIR || 'outputs'),

  // Auth & Security
  jwtSecret: process.env.JWT_SECRET || 'rukhi_production_super_secret_jwt_key_2026_persist',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',

  // AI Video Engine
  aiVideoProvider: process.env.AI_VIDEO_PROVIDER || 'colab',
  aiVideoGpuEndpoint: process.env.AI_VIDEO_GPU_ENDPOINT || 'https://allen-wiley-true-actively.trycloudflare.com/generate-video',
  huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY || '',

  // Cashfree Payment Gateway
  cashfreeAppId: process.env.CASHFREE_APP_ID || '',
  cashfreeSecretKey: process.env.CASHFREE_SECRET_KEY || '',
  cashfreeEnv: process.env.CASHFREE_ENV || 'PRODUCTION',

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@autocaptions.ai',
  },
};

export default config;
