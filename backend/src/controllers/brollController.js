import { autoDetectAndFetchBRoll, searchBRollClips } from '../services/media/brollService.js';
import { generateConsistentAIReel } from '../services/ai/aiReelService.js';
import { generateScriptForPrompt } from '../services/media/legacyVideoGeneratorService.js';
import { checkIdempotency, checkUserAndSystemQuotas, checkUserPlanAccess } from '../services/ai/budgetGuardService.js';
import { query } from '../db/pool.js';
import { config } from '../config/env.js';

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
    console.error(`[B-ROLL CONTROLLER ERROR] autoDetectBRoll failed:`, err.stack || err);
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
    console.error(`[B-ROLL CONTROLLER ERROR] searchBRoll failed:`, err.stack || err);
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
    console.error(`[B-ROLL CONTROLLER ERROR] generateScriptOnly failed:`, err.stack || err);
    next(err);
  }
}

/**
 * Generate a complete Consistent Character AI Reel with Idempotency Locks & Budget Protection
 */
export async function generateFacelessReel(req, res, next) {
  try {
    const {
      prompt,
      stylePreset = 'ENTREPRENEUR',
      targetLanguage = 'chatting',
      durationSec = 30,
      aspectRatio = '9:16',
      existingReelId,
    } = req.body;

    const userId = req.user?.id || req.headers['x-user-id'] || null;
    const userPlan = req.user?.plan || req.headers['x-user-plan'] || req.body.userPlan || 'PLUS'; // Defaults to PLUS for testing
    const idempotencyKey = req.headers['x-idempotency-key'] || existingReelId || null;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Prompt topic is required' });
    }

    // 1. Idempotency Check: Prevent Duplicate Paid Generations
    const idempotencyCheck = await checkIdempotency(idempotencyKey, prompt.trim(), userId);
    if (idempotencyCheck.isDuplicate && idempotencyCheck.project) {
      const p = idempotencyCheck.project;
      console.log(`[B-ROLL CONTROLLER] ⚡ Returning existing idempotent project ${p.id} (Status: ${p.status}).`);
      return res.json({
        success: true,
        reelId: p.id,
        id: p.id,
        title: p.title,
        videoUrl: p.video_url,
        duration: p.duration,
        status: p.status,
        isIdempotent: true,
      });
    }

    // 2. Budget Guard & User Quotas Check
    await checkUserAndSystemQuotas(userId);

    // 3. Rukhi 4-Tier Plan Gating Check
    const planAccess = await checkUserPlanAccess({
      userId,
      userPlan,
      action: 'AI_REEL',
      durationSec: parseInt(durationSec, 10) || 30,
      aspectRatio,
    });

    const applyWatermark = planAccess.plan === 'PLUS';

    console.log(`[B-ROLL CONTROLLER] 🚀 Launching Consistent Character AI Reel Engine (Plan: ${planAccess.plan}, Style: ${stylePreset}, Length: ${durationSec}s, Format: ${aspectRatio}, WM: ${applyWatermark}, Lang: ${targetLanguage})`);

    const result = await generateConsistentAIReel({
      topicPrompt: prompt.trim(),
      duration: parseInt(durationSec, 10) || 30,
      stylePreset,
      voicePreset: 'TE_MALE',
      targetLanguage,
      aspectRatio,
      applyWatermark,
      userId,
      existingReelId: idempotencyKey || existingReelId,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error(`[B-ROLL CONTROLLER ERROR] ❌ /api/broll/generate-faceless-reel failed:\n`, err.stack || err.message || err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'AI Reel Generation failed',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
}

/**
 * Poll Status of an AI Reel Job
 */
export async function getReelStatus(req, res, next) {
  try {
    const { id } = req.params;
    const dbRes = await query(
      `SELECT id, title, video_url, status, duration, created_at, updated_at FROM projects WHERE id = $1`,
      [id]
    );

    if (dbRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Reel job not found' });
    }

    const project = dbRes.rows[0];
    return res.json({
      success: true,
      project: {
        reelId: project.id,
        id: project.id,
        title: project.title,
        videoUrl: project.video_url,
        status: project.status,
        duration: project.duration,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
    });
  } catch (err) {
    console.error(`[B-ROLL CONTROLLER ERROR] getReelStatus failed:`, err.stack || err);
    next(err);
  }
}

/**
 * Production Health Check Endpoint ($0 Cost)
 */
export async function getEngineHealth(req, res, next) {
  try {
    let dbStatus = 'healthy';
    try {
      await query('SELECT 1');
    } catch (_) {
      dbStatus = 'degraded';
    }

    const hasApiKey = Boolean(config.gcpApiKey || config.geminiApiKey);

    return res.json({
      success: true,
      status: dbStatus === 'healthy' && hasApiKey ? 'healthy' : 'degraded',
      services: {
        database: dbStatus,
        geminiApiKey: hasApiKey ? 'configured' : 'missing',
        veoModel: config.veoModel || 'veo-3.1-lite-generate-001',
      },
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, status: 'unhealthy', error: err.message });
  }
}
