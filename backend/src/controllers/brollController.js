import { autoDetectAndFetchBRoll, searchBRollClips } from '../services/media/brollService.js';
import { generateConsistentAIReel } from '../services/ai/aiReelService.js';
import { generateScriptForPrompt } from '../services/media/legacyVideoGeneratorService.js';

/**
 * Auto-detect visual keywords and generate AI video overlays for timeline segments
 */
export async function autoDetectBRoll(req, res, next) {
  try {
    const { segments = [] } = req.body;

    if (!Array.isArray(segments) || segments.length === 0) {
      return res.status(400).json({ success: false, error: 'Timeline segments array is required' });
    }

    console.log(`[B-ROLL CONTROLLER] 📥 /api/broll/auto-detect for ${segments.length} segments`);
    const result = await autoDetectAndFetchBRoll(segments);

    return res.json({
      success: true,
      keywords: result.keywords,
      overlays: result.overlays,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Search AI Video clips by custom keyword using Hunyuan & LTX AI models
 */
export async function searchBRoll(req, res, next) {
  try {
    const keyword = req.query.keyword || req.body.keyword || 'nature';
    console.log(`[B-ROLL CONTROLLER] 🔍 Searching AI Video clips for keyword: "${keyword}"`);

    const clips = await searchBRollClips(keyword, 4);

    return res.json({
      success: true,
      keyword,
      clips,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Standalone Script Generator endpoint for Script Preview ($0 Cost)
 */
export async function generateScriptOnly(req, res, next) {
  try {
    const { prompt, targetLanguage = 'te', durationSec = 30 } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Text prompt is required' });
    }

    console.log(`[B-ROLL CONTROLLER] ✍️ Generating script preview for prompt: "${prompt}"`);
    const scriptText = await generateScriptForPrompt({ prompt, targetLanguage, durationSec });

    return res.json({
      success: true,
      scriptText,
      targetLanguage,
      durationSec,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Generate a complete Consistent Character AI Reel from a topic or text prompt
 */
export async function generateFacelessReel(req, res, next) {
  try {
    const {
      prompt,
      stylePreset = 'ENTREPRENEUR',
      targetLanguage = 'chatting',
      durationSec = 30,
    } = req.body;

    const userId = req.user?.id || req.headers['x-user-id'] || null;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Prompt topic is required' });
    }

    console.log(`[B-ROLL CONTROLLER] 🚀 Launching Consistent Character AI Reel Engine (Style: ${stylePreset}, Length: ${durationSec}s, Lang: ${targetLanguage})`);

    const result = await generateConsistentAIReel({
      topicPrompt: prompt.trim(),
      duration: parseInt(durationSec, 10) || 30,
      stylePreset,
      voicePreset: 'TE_MALE',
      targetLanguage,
      userId,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}
