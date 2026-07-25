import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbUrl: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || 'postgres://postgres:postgres@localhost:5432/auto_captions_db',
  redis: {
    url: process.env.REDIS_URL || null,
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
  uploadDir: path.resolve(__dirname, '../../uploads'),
  outputDir: path.resolve(__dirname, '../../outputs'),
};
