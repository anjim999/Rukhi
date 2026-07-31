import crypto from 'crypto';
import { query } from '../../db/pool.js';

const MAX_USER_DAILY_REELS = parseInt(process.env.MAX_USER_DAILY_REELS, 10) || 10;
const MAX_SYSTEM_DAILY_REELS = parseInt(process.env.MAX_SYSTEM_DAILY_REELS, 10) || 100;
const FREE_CAPTION_LIMIT = parseInt(process.env.FREE_CAPTION_LIMIT, 10) || 3;

/**
 * Generates a deterministic Idempotency Key hash from request payload if not provided
 */
export function generateIdempotencyKey(prompt, userId, durationSec = 30) {
  const raw = `${userId || 'anon'}:${prompt.trim().toLowerCase()}:${durationSec}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Checks if a job with the given idempotency key or prompt was submitted in the last 15 minutes
 */
export async function checkIdempotency(idempotencyKey, prompt, userId) {
  try {
    const keyToUse = idempotencyKey || generateIdempotencyKey(prompt, userId);

    const res = await query(
      `SELECT id, title, video_url, status, duration, created_at 
       FROM projects 
       WHERE (id = $1 OR (title = $2 AND (user_id = $3 OR user_id IS NULL)))
         AND created_at >= NOW() - INTERVAL '15 minutes'
       ORDER BY created_at DESC 
       LIMIT 1`,
      [keyToUse, prompt.substring(0, 50), userId || null]
    );

    if (res.rows.length > 0) {
      const existing = res.rows[0];
      console.log(`[BUDGET GUARD] ⚡ [IDEMPOTENCY MATCH] Found recent project (${existing.id}, status=${existing.status}). Skipping duplicate Veo generation.`);
      return {
        isDuplicate: true,
        project: existing,
      };
    }
  } catch (err) {
    console.warn(`[BUDGET GUARD WARN] Idempotency check notice: ${err.message}`);
  }

  return { isDuplicate: false, project: null };
}

/**
 * Verifies per-user daily quota and system-wide daily budget caps
 */
export async function checkUserAndSystemQuotas(userId) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  if (userId) {
    try {
      const userCountRes = await query(
        `SELECT COUNT(*) as count FROM projects WHERE user_id = $1 AND created_at >= $2`,
        [userId, todayStart]
      );
      const userCount = parseInt(userCountRes.rows[0]?.count || 0, 10);
      if (userCount >= MAX_USER_DAILY_REELS) {
        const err = new Error(`Daily reel generation limit reached (${MAX_USER_DAILY_REELS} reels/day). Please try again tomorrow.`);
        err.status = 429;
        throw err;
      }
    } catch (err) {
      if (err.status === 429) throw err;
      console.warn(`[BUDGET GUARD WARN] User quota check notice: ${err.message}`);
    }
  }

  try {
    const sysCountRes = await query(
      `SELECT COUNT(*) as count FROM projects WHERE created_at >= $1`,
      [todayStart]
    );
    const systemCount = parseInt(sysCountRes.rows[0]?.count || 0, 10);
    if (systemCount >= MAX_SYSTEM_DAILY_REELS) {
      const err = new Error(`System daily generation capacity reached (${MAX_SYSTEM_DAILY_REELS} reels/day). Please try again tomorrow.`);
      err.status = 429;
      throw err;
    }
  } catch (err) {
    if (err.status === 429) throw err;
    console.warn(`[BUDGET GUARD WARN] System budget check notice: ${err.message}`);
  }

  return { allowed: true };
}

/**
 * Enforces Rukhi 4-Tier Plan Gating:
 * - FREE: 3 Free Captions, 0 AI Reels
 * - BASIC (₹79/mo): Unlimited Captions, 0 AI Reels
 * - PLUS (₹199/mo): 30s Max AI Reels, 9:16 Vertical only, Small Watermark
 * - PRO (₹299/mo): 60s Max AI Reels, 9:16/16:9/1:1 Formats, Watermark-Free
 * - DUBBING_STUDIO (₹399/mo): Everything in Pro + Full Multilingual Voice Dubbing Studio
 */
export async function checkUserPlanAccess({ userId, userPlan = 'FREE', action = 'AI_REEL', durationSec = 30, aspectRatio = '9:16' }) {
  const normalizedPlan = (userPlan || 'FREE').toUpperCase();

  if (action === 'AI_REEL') {
    if (['FREE', 'BASIC'].includes(normalizedPlan)) {
      const err = new Error('AI Video Reel Generation requires a Plus (₹199/mo), Pro (₹299/mo), or Dubbing Studio (₹399/mo) plan.');
      err.status = 403;
      throw err;
    }

    if (normalizedPlan === 'PLUS') {
      if (durationSec > 30) {
        const err = new Error('60-second video reels require a Pro Plan (₹299/mo) or Dubbing Studio Plan.');
        err.status = 403;
        throw err;
      }
      if (aspectRatio !== '9:16') {
        const err = new Error('Multi-format landscape (16:9) and square (1:1) exports require a Pro Plan (₹299/mo).');
        err.status = 403;
        throw err;
      }
    }
  }

  if (action === 'CAPTION') {
    if (normalizedPlan === 'FREE' && userId) {
      try {
        const capRes = await query(
          `SELECT COUNT(*) as count FROM projects WHERE user_id = $1 AND title NOT LIKE 'AI Reel%'`,
          [userId]
        );
        const count = parseInt(capRes.rows[0]?.count || 0, 10);
        if (count >= FREE_CAPTION_LIMIT) {
          const err = new Error(`You have reached your 3 free captions limit. Upgrade to Basic Plan (₹79/mo) for unlimited captions!`);
          err.status = 403;
          throw err;
        }
      } catch (err) {
        if (err.status === 403) throw err;
      }
    }
  }

  if (action === 'DUBBING_STUDIO') {
    if (!['DUBBING_STUDIO', 'ENTERPRISE'].includes(normalizedPlan)) {
      const err = new Error('Full Multilingual Voice Dubbing Studio features require the Dubbing Studio Plan (₹399/mo).');
      err.status = 403;
      throw err;
    }
  }

  return { allowed: true, plan: normalizedPlan };
}
