import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

/**
 * Measure exact audio duration in seconds using ffprobe with pure JS fallback
 */
export async function getExactAudioDuration(filePath) {
  try {
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    const { stdout } = await execPromise(cmd);
    const dur = parseFloat(stdout.trim());
    if (!isNaN(dur) && dur > 0) {
      return Number(dur.toFixed(2));
    }
  } catch (_err) {
    // ffprobe not installed or failed, fall back to pure JS calculation below
  }

  // Pure JS fallback MP3 duration estimation (Edge-TTS 24kHz @ ~48-64kbps = ~6000 bytes/sec)
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const estSec = stats.size / 6000;
      if (estSec > 0) {
        console.log(`[FACELESS GEN] ⏱️ Pure JS calculated exact audio duration: ${estSec.toFixed(2)}s`);
        return Number(estSec.toFixed(2));
      }
    }
  } catch (err) {
    console.warn(`[FACELESS GEN] Pure JS audio duration check warning: ${err.message}`);
  }
  return null;
}
