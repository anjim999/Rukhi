import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rawPort = process.env.PORT || process.env.PASSENGER_APP_PORT || '5000';

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
  uploadDir: process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'storage/uploads'),
  outputDir: process.env.OUTPUT_DIR || path.resolve(process.cwd(), 'storage/exports'),
  tempDir: process.env.TEMP_DIR || path.resolve(process.cwd(), 'storage/temp'),
  logsDir: process.env.LOGS_DIR || path.resolve(process.cwd(), 'storage/logs'),
};
