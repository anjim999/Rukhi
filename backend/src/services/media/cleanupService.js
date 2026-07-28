import fs from 'fs/promises';
import existsFs from 'fs';
import path from 'path';
import { config } from '../../config/env.js';

const THREE_DAYS_MS = 72 * 60 * 60 * 1000; // 72 Hours in milliseconds
const CHECK_INTERVAL_MS = 60 * 60 * 1000;  // Run audit every 1 hour

/**
 * Scans specified directory and permanently deletes files older than maxAgeMs.
 * @param {string} dirPath - Absolute path to directory
 * @param {number} maxAgeMs - Threshold age in milliseconds (default: 72 hours)
 */
export async function purgeOldFiles(dirPath, maxAgeMs = THREE_DAYS_MS) {
  if (!existsFs.existsSync(dirPath)) return;

  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    const now = Date.now();
    let deletedCount = 0;
    let freedBytes = 0;

    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);

      // Avoid deleting hidden system files like .gitkeep or .gitignore
      if (file.name.startsWith('.')) continue;

      if (file.isDirectory()) {
        // Recursively audit subdirectories
        await purgeOldFiles(fullPath, maxAgeMs);
      } else if (file.isFile()) {
        try {
          const stats = await fs.stat(fullPath);
          const ageMs = now - stats.mtimeMs;

          if (ageMs > maxAgeMs) {
            const ageHours = (ageMs / (1000 * 60 * 60)).toFixed(1);
            const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

            await fs.unlink(fullPath);
            deletedCount++;
            freedBytes += stats.size;

            console.log(
              `[3-DAY CLEANUP] Deleted expired file: ${file.name} | Size: ${fileSizeMB} MB | Age: ${ageHours} hrs`
            );
          }
        } catch (err) {
          console.error(`[3-DAY CLEANUP] Failed to process ${fullPath}:`, err.message);
        }
      }
    }

    if (deletedCount > 0) {
      const totalFreedMB = (freedBytes / (1024 * 1024)).toFixed(2);
      console.log(
        `[3-DAY CLEANUP] Finished audit in ${dirPath}. Purged ${deletedCount} expired file(s) freeing ${totalFreedMB} MB.`
      );
    }
  } catch (err) {
    console.error(`[3-DAY CLEANUP] Error reading directory ${dirPath}:`, err.message);
  }
}

/**
 * Initializes the background 3-day file cleanup daemon.
 */
export function initAutoCleanupDaemon() {
  const targetDirectories = Array.from(
    new Set([
      config.uploadDir,
      config.outputDir,
      path.resolve(process.cwd(), 'uploads'),
      path.resolve(process.cwd(), 'outputs'),
      path.resolve(process.cwd(), 'backend/uploads'),
      path.resolve(process.cwd(), 'backend/outputs'),
    ])
  );

  console.log('[3-DAY CLEANUP] Initializing automatic 72-hour file purge daemon...');

  // Helper execution function
  const runCleanup = async () => {
    for (const dir of targetDirectories) {
      await purgeOldFiles(dir, THREE_DAYS_MS);
    }
  };

  // 1. Run audit immediately on startup
  runCleanup().catch((err) =>
    console.error('[3-DAY CLEANUP] Initial startup cleanup error:', err.message)
  );

  // 2. Schedule hourly background audit
  const intervalId = setInterval(runCleanup, CHECK_INTERVAL_MS);

  // Unref timer so it does not block Node process exit on shutdown
  if (intervalId.unref) {
    intervalId.unref();
  }

  return intervalId;
}
