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
 * Allowed MIME types for video uploads.
 * @readonly
 */
const ALLOWED_MIME_TYPES = Object.freeze([
  'video/mp4',
  'video/webm',
  'video/quicktime',   // .mov
  'video/x-msvideo',   // .avi
  'video/x-matroska',  // .mkv
]);

/**
 * Maximum file size: 500 MB
 * Sufficient for most short-form reels (15s – 3min).
 */
const MAX_FILE_SIZE = 500 * 1024 * 1024;

/**
 * Multer disk storage configuration.
 * - Saves files to config.uploadDir
 * - Renames files with UUID to avoid collisions
 */
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, config.uploadDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

/**
 * File filter — reject unsupported MIME types early.
 */
function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`, 400));
  }
}

/**
 * Configured multer instance for single video file uploads.
 *
 * Usage in a route:
 *   import { uploadVideo } from '../utils/fileUpload.js';
 *   router.post('/upload', uploadVideo.single('video'), controller);
 */
export const uploadVideo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});
