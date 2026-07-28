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
 * Generate a complete AI Faceless Reel Project from a text prompt or approved script ($0 Cost)
 */
export async function generateFacelessReel({ prompt, scriptText, targetLanguage = 'te', voiceProvider = 'edge', durationSec = 30, visualMode = 'cinematic', aspectRatio = '9:16' }) {
  const data = await axiosClient.post(
    '/broll/generate-faceless',
    {
      prompt,
      scriptText,
      targetLanguage,
      voiceProvider,
      durationSec,
      visualMode,
      aspectRatio,
    },
    { timeout: 0 } // timeout: 0 = Unlimited / No Timeout Limit for long-form 30-minute videos
  );
  return data;
}
