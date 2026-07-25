import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { config } from '../../config/env.js';

/**
 * Demucs AI Vocal Separation Service — Meta Open Source (FREE)
 *
 * Uses Meta's Demucs deep learning model to separate human vocals
 * from background music (BGM), instruments, bass, and drums.
 *
 * This produces a clean vocal-only WAV track that Deepgram Nova-2
 * can transcribe with 95%+ accuracy even on heavy BGM videos.
 *
 * Graceful Fallback: If Demucs is not installed or fails, returns
 * the original audio path so the pipeline never crashes.
 */

const DEMUCS_MODEL = 'htdemucs';
const DEMUCS_STEM = 'vocals';

/**
 * Check if Demucs is installed and available on this system.
 * @returns {Promise<boolean>}
 */
export async function isDemucsAvailable() {
  return new Promise((resolve) => {
    const proc = spawn('python3', ['-m', 'demucs', '--help'], {
      timeout: 10000,
    });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

/**
 * Separate vocals from background music using Meta's Demucs AI model.
 *
 * @param {string} audioPath - Path to the input audio WAV file
 * @param {string} projectId - Project ID for output directory naming
 * @returns {Promise<string>} Path to the clean vocal-only WAV file
 */
export async function separateVocals(audioPath, projectId) {
  const outputDir = path.join(config.uploadDir, `demucs_${projectId}`);
  const expectedVocalPath = path.join(outputDir, DEMUCS_MODEL, path.basename(audioPath, path.extname(audioPath)), `${DEMUCS_STEM}.wav`);

  // If already separated, return cached result
  if (fs.existsSync(expectedVocalPath)) {
    console.log(`[DEMUCS] ♻️ Using cached vocal track: ${expectedVocalPath}`);
    return expectedVocalPath;
  }

  // Check if Demucs is available
  const available = await isDemucsAvailable();
  if (!available) {
    console.warn(`[DEMUCS] ⚠️ Demucs not installed. Falling back to original audio (BGM may affect accuracy).`);
    return audioPath;
  }

  console.log(`[DEMUCS] 🎤 Separating vocals from BGM using Meta AI Demucs (Model: ${DEMUCS_MODEL})...`);
  const startTime = Date.now();

  try {
    await new Promise((resolve, reject) => {
      const proc = spawn('python3', [
        '-m', 'demucs',
        '--two-stems', DEMUCS_STEM,
        '-n', DEMUCS_MODEL,
        '--out', outputDir,
        '--device', 'cpu',
        '--jobs', '2',
        audioPath,
      ], {
        timeout: 120000, // 2 minute max timeout
      });

      let stderr = '';
      proc.stdout.on('data', (data) => {
        const line = data.toString().trim();
        if (line) console.log(`[DEMUCS] ${line}`);
      });
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        const line = data.toString().trim();
        if (line && !line.includes('UserWarning')) console.log(`[DEMUCS] ${line}`);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Demucs exited with code ${code}: ${stderr.substring(0, 300)}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Demucs process error: ${err.message}`));
      });
    });

    const latencyMs = Date.now() - startTime;

    if (fs.existsSync(expectedVocalPath)) {
      console.log(`[DEMUCS] ✅ Vocal separation complete in ${(latencyMs / 1000).toFixed(1)}s — Clean vocal track: ${expectedVocalPath}`);
      return expectedVocalPath;
    } else {
      console.warn(`[DEMUCS] ⚠️ Vocal file not found at expected path. Falling back to original audio.`);
      return audioPath;
    }
  } catch (err) {
    console.warn(`[DEMUCS] ⚠️ Vocal separation failed (${err.message}). Falling back to original audio.`);
    return audioPath;
  }
}

/**
 * Cleanup Demucs temporary output files for a project.
 * @param {string} projectId
 */
export async function cleanupDemucsOutput(projectId) {
  const outputDir = path.join(config.uploadDir, `demucs_${projectId}`);
  try {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
      console.log(`[DEMUCS] 🗑️ Cleaned up temporary files: ${outputDir}`);
    }
  } catch (err) {
    console.warn(`[DEMUCS] Cleanup warning: ${err.message}`);
  }
}
