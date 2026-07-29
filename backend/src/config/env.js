import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envCandidatePaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  '/home/u209580425/.env',
];

for (const envPath of envCandidatePaths) {
  dotenv.config({ path: envPath });
}


const isHostinger = process.cwd().includes('u209580425') || process.cwd().includes('rukhi.in');
const persistentBase = '/home/u209580425/persistent_storage';

const rawPort = process.env.PORT || '5000';

export const config = {
  port: isNaN(parseInt(rawPort, 10)) ? rawPort : parseInt(rawPort, 10),

  nodeEnv: process.env.NODE_ENV || 'development',
  dbUrl: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL,
  redis: {
    url: process.env.REDIS_URL || null,
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
  jwtSecret: process.env.JWT_SECRET || process.env.JWT_SECREATE || 'auto_captions_super_secret_key_2026',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  uploadDir: isHostinger ? path.join(persistentBase, 'uploads') : path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'storage/uploads'),
  outputDir: isHostinger ? path.join(persistentBase, 'outputs') : path.resolve(process.cwd(), process.env.OUTPUT_DIR || 'storage/exports'),
  tempDir: isHostinger ? path.join(persistentBase, 'temp') : path.resolve(process.cwd(), process.env.TEMP_DIR || 'storage/temp'),
  logsDir: isHostinger ? path.join(persistentBase, 'logs') : path.resolve(process.cwd(), process.env.LOGS_DIR || 'storage/logs'),
};
