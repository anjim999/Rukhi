/**
 * Rukhi Film Engine v1.0 - Budget Optimizer & SHA-256 Render Cache
 * Fingerprints scene payloads with SHA-256 hashing to skip redundant GCP API calls,
 * preserving GCP trial credits and returning cached assets instantly.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const budgetOptimizerService = {
  /**
   * Generates a unique SHA-256 fingerprint hash for a scene request
   */
  generatePayloadFingerprint(compiledBrief) {
    const rawPayload = JSON.stringify({
      series: compiledBrief.series_title,
      scene: compiledBrief.scene_title,
      duration: compiledBrief.target_duration_seconds,
      characters: compiledBrief.characters?.map(c => `${c.id}_v${c.version}`),
      location: compiledBrief.location?.id || 'default_set',
      camera: compiledBrief.visual_grammar?.camera,
      lighting: compiledBrief.visual_grammar?.lighting,
      dialogue: compiledBrief.script_dialogue,
      user_notes: compiledBrief.user_notes
    });

    return crypto.createHash('sha256').update(rawPayload).digest('hex');
  },

  /**
   * Checks local disk cache for matching fingerprint render
   */
  async checkRenderCache(fingerprint) {
    const outputsDir = path.resolve(process.cwd(), 'outputs');
    const cachedFilename = `cache_${fingerprint.substring(0, 16)}.mp4`;
    const cachedFilePath = path.join(outputsDir, cachedFilename);

    if (fs.existsSync(cachedFilePath)) {
      console.log(`[BUDGET OPTIMIZER] 💰 CACHE HIT! Fingerprint ${fingerprint.substring(0, 8)}... matched existing render!`);
      console.log(`  ✓ Skipping GCP API call. Serving cached asset: /outputs/${cachedFilename}`);
      return {
        cached: true,
        outputVideoUrl: `/outputs/${cachedFilename}`,
        localPath: cachedFilePath,
        fingerprint
      };
    }

    console.log(`[BUDGET OPTIMIZER] 💳 Cache miss for fingerprint ${fingerprint.substring(0, 8)}... Rendering new clip via Vertex AI.`);
    return { cached: false, fingerprint };
  },

  /**
   * Saves generated render into cache index
   */
  saveToCache(fingerprint, sourceVideoPath) {
    try {
      const outputsDir = path.resolve(process.cwd(), 'outputs');
      const cachedFilename = `cache_${fingerprint.substring(0, 16)}.mp4`;
      const targetPath = path.join(outputsDir, cachedFilename);

      if (fs.existsSync(sourceVideoPath) && !fs.existsSync(targetPath)) {
        fs.copyFileSync(sourceVideoPath, targetPath);
        console.log(`[BUDGET OPTIMIZER] 💾 Saved render fingerprint ${fingerprint.substring(0, 8)}... to cache index!`);
      }
    } catch (err) {
      console.warn('[BUDGET OPTIMIZER WARN] Failed to save to cache:', err.message);
    }
  }
};
