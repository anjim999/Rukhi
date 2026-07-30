import axiosClient from '../api/axiosClient';

/**
 * Frontend B-Roll & AI Video Generator Service
 * Note: axiosClient response interceptor automatically unwraps response.data.
 */

/**
 * Auto-detect visual keywords and fetch B-Roll overlays for timeline segments
 */
export async function autoDetectBRollOverlays(segments = []) {
  const data = await axiosClient.post('/broll/auto-detect', { segments });
  return data;
}

/**
 * Standalone Script Generator for script preview ($0 Cost)
 */
export async function generateScriptOnly({ prompt, targetLanguage = 'te', durationSec = 30 }) {
  const data = await axiosClient.post('/broll/generate-script', {
    prompt,
    targetLanguage,
    durationSec,
  });
  return data;
}

/**
 * Search stock Pexels / Pixabay B-Roll media by query string
 */
export async function searchStockBroll(query = '') {
  const data = await axiosClient.get('/broll/search', { params: { query } });
  return data;
}

/**
 * Generate a complete AI Faceless Reel Project from a text prompt or approved script ($0 Cost)
 */
export async function generateFacelessReel({ prompt, stylePreset = 'ENTREPRENEUR', targetLanguage = 'chatting', durationSec = 30 }) {
  const data = await axiosClient.post(
    '/broll/generate-faceless',
    {
      prompt,
      stylePreset,
      targetLanguage,
      durationSec,
    },
    { timeout: 0 }
  );
  return data;
}
