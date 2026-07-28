import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { config } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

/**
 * Multer disk storage configuration.
 */
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, config.uploadDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.webm';
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

function videoFilter(_req, file, cb) {
  const mime = (file.mimetype || '').toLowerCase();
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (
    mime.startsWith('video/') ||
    mime === 'application/octet-stream' ||
    ['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(new AppError(`Unsupported file type: ${file.mimetype}.`, 400));
  }
}

function audioFilter(_req, file, cb) {
  const mime = (file.mimetype || '').toLowerCase();
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (
    mime.startsWith('audio/') ||
    mime === 'application/octet-stream' ||
    ['.webm', '.wav', '.mp3', '.ogg', '.m4a', '.aac'].includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(new AppError(`Unsupported audio type: ${file.mimetype}.`, 400));
  }
}

export const uploadVideo = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: 1024 * 1024 * 1024 },
});

export const uploadAudio = multer({
  storage,
  fileFilter: audioFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});
