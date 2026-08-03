import { query } from '../../db/pool.js';
import PRICING_CONFIG from '../../config/pricingConfig.js';

/**
 * Rukhi Production Telemetry & Cost Ledger Service
 * Tracks real token counts, image renders, video seconds, STT minutes, dubbing, voice cloning, and storage
 * calculates exact USD/INR costs and persists per-user telemetry in PostgreSQL.
 */
export const productionLedgerService = {
  /**
   * Initialize a new cost tracking record for a generation run.
   */
  async startLedger({
    generationId,
    userId = null,
    userEmail = null,
    projectId = null,
    seriesId = null,
    featureType = 'studio_render', // 'studio_render', 'caption_generation', 'dubbing', 'voice_cloning', 'stt'
    episode = 1,
    scene = 1
  }) {
    const genId = generationId || `gen_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    try {
      await query(
        `INSERT INTO studio_generation_costs (
          generation_id, user_id, user_email, project_id, series_id, feature_type, episode, scene, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'IN_PROGRESS')
        ON CONFLICT (generation_id) DO UPDATE SET status = 'IN_PROGRESS';`,
        [genId, userId, userEmail, projectId, seriesId, featureType, episode, scene]
      );
      console.log(`[PRODUCTION LEDGER] Started telemetry tracking for GenID: ${genId} (${featureType})`);
      return genId;
    } catch (err) {
      console.error(`[PRODUCTION LEDGER ERROR] startLedger failed:`, err.message);
      return genId;
    }
  },

  /**
   * Record Gemini LLM Token Usage and calculate exact USD & INR cost.
   */
  async recordGeminiUsage({ generationId, model = 'gemini-2.5-flash', inputTokens = 0, outputTokens = 0 }) {
    if (!generationId) return;

    const rates = model.includes('pro') ? PRICING_CONFIG.GEMINI_15_PRO : PRICING_CONFIG.GEMINI_25_FLASH;
    const inputCost = (inputTokens / 1_000_000) * rates.inputPricePerMillion;
    const outputCost = (outputTokens / 1_000_000) * rates.outputPricePerMillion;
    const costUsd = inputCost + outputCost;

    try {
      await query(
        `UPDATE studio_generation_costs
         SET gemini_model = $2,
             gemini_input_tokens = COALESCE(gemini_input_tokens, 0) + $3,
             gemini_output_tokens = COALESCE(gemini_output_tokens, 0) + $4,
             gemini_cost_usd = COALESCE(gemini_cost_usd, 0) + $5
         WHERE generation_id = $1;`,
        [generationId, model, inputTokens, outputTokens, costUsd]
      );

      console.log(`[TELEMETRY METRICS] Gemini ${model} | Input: ${inputTokens} tks | Output: ${outputTokens} tks | Cost: $${costUsd.toFixed(6)}`);
      await this.recalculateTotalCost(generationId);
    } catch (err) {
      console.error(`[PRODUCTION LEDGER ERROR] recordGeminiUsage failed:`, err.message);
    }
  },

  /**
   * Record Imagen 3 Generation Metrics.
   */
  async recordImagenUsage({ generationId, model = 'imagen-3.0-generate-001', requested = 1, generated = 1 }) {
    if (!generationId) return;

    const costUsd = generated * PRICING_CONFIG.IMAGEN_3.pricePerImage;

    try {
      await query(
        `UPDATE studio_generation_costs
         SET imagen_model = $2,
             imagen_requested = COALESCE(imagen_requested, 0) + $3,
             imagen_generated = COALESCE(imagen_generated, 0) + $4,
             imagen_cost_usd = COALESCE(imagen_cost_usd, 0) + $5
         WHERE generation_id = $1;`,
        [generationId, model, requested, generated, costUsd]
      );

      console.log(`[TELEMETRY METRICS] Imagen 3 | Generated: ${generated} imgs | Cost: $${costUsd.toFixed(4)}`);
      await this.recalculateTotalCost(generationId);
    } catch (err) {
      console.error(`[PRODUCTION LEDGER ERROR] recordImagenUsage failed:`, err.message);
    }
  },

  /**
   * Record Veo 3 Video Generation Metrics.
   */
  async recordVeoUsage({ generationId, model = 'veo-3.1', clips = 1, seconds = 5, resolution = '1080p' }) {
    if (!generationId) return;

    const costUsd = seconds * PRICING_CONFIG.VEO_3.pricePerSecond;

    try {
      await query(
        `UPDATE studio_generation_costs
         SET veo_model = $2,
             veo_clips = COALESCE(veo_clips, 0) + $3,
             veo_seconds = COALESCE(veo_seconds, 0) + $4,
             veo_resolution = $5,
             veo_cost_usd = COALESCE(veo_cost_usd, 0) + $6
         WHERE generation_id = $1;`,
        [generationId, model, clips, seconds, resolution, costUsd]
      );

      console.log(`[TELEMETRY METRICS] Veo Video | Clips: ${clips} | Duration: ${seconds}s | Cost: $${costUsd.toFixed(4)}`);
      await this.recalculateTotalCost(generationId);
    } catch (err) {
      console.error(`[PRODUCTION LEDGER ERROR] recordVeoUsage failed:`, err.message);
    }
  },

  /**
   * Record STT Speech-to-Text Metrics (Caption Generation).
   */
  async recordSttUsage({ generationId, provider = 'Deepgram', minutes = 1.0 }) {
    if (!generationId) return;

    const rate = provider.toLowerCase().includes('whisper')
      ? PRICING_CONFIG.STT_WHISPER.pricePerMinute
      : PRICING_CONFIG.STT_DEEPGRAM.pricePerMinute;
    const costUsd = minutes * rate;

    try {
      await query(
        `UPDATE studio_generation_costs
         SET stt_provider = $2,
             stt_minutes = COALESCE(stt_minutes, 0) + $3,
             stt_cost_usd = COALESCE(stt_cost_usd, 0) + $4
         WHERE generation_id = $1;`,
        [generationId, provider, minutes, costUsd]
      );

      console.log(`[TELEMETRY METRICS] STT (${provider}) | Duration: ${minutes.toFixed(2)} min | Cost: $${costUsd.toFixed(6)}`);
      await this.recalculateTotalCost(generationId);
    } catch (err) {
      console.error(`[PRODUCTION LEDGER ERROR] recordSttUsage failed:`, err.message);
    }
  },

  /**
   * Record Audio Dubbing & Isolation Metrics.
   */
  async recordDubbingUsage({ generationId, minutes = 1.0 }) {
    if (!generationId) return;

    const costUsd = minutes * PRICING_CONFIG.DUBBING_DEMUCS.pricePerMinute;

    try {
      await query(
        `UPDATE studio_generation_costs
         SET dubbing_minutes = COALESCE(dubbing_minutes, 0) + $2,
             dubbing_cost_usd = COALESCE(dubbing_cost_usd, 0) + $3
         WHERE generation_id = $1;`,
        [generationId, minutes, costUsd]
      );

      console.log(`[TELEMETRY METRICS] Audio Dubbing | Minutes: ${minutes.toFixed(2)} min | Cost: $${costUsd.toFixed(4)}`);
      await this.recalculateTotalCost(generationId);
    } catch (err) {
      console.error(`[PRODUCTION LEDGER ERROR] recordDubbingUsage failed:`, err.message);
    }
  },

  /**
   * Record Voice Cloning & Chirp TTS Metrics.
   */
  async recordVoiceUsage({ generationId, samples = 0, characters = 0 }) {
    if (!generationId) return;

    const sampleCost = samples * PRICING_CONFIG.VOICE_CLONING.pricePerSample;
    const ttsCost = (characters / 1000) * PRICING_CONFIG.VOICE_CLONING.ttsPricePer1kChars;
    const costUsd = sampleCost + ttsCost;

    try {
      await query(
        `UPDATE studio_generation_costs
         SET voice_clone_samples = COALESCE(voice_clone_samples, 0) + $2,
             tts_characters = COALESCE(tts_characters, 0) + $3,
             voice_cost_usd = COALESCE(voice_cost_usd, 0) + $4
         WHERE generation_id = $1;`,
        [generationId, samples, characters, costUsd]
      );

      console.log(`[TELEMETRY METRICS] Voice Cloning/TTS | Samples: ${samples} | Chars: ${characters} | Cost: $${costUsd.toFixed(4)}`);
      await this.recalculateTotalCost(generationId);
    } catch (err) {
      console.error(`[PRODUCTION LEDGER ERROR] recordVoiceUsage failed:`, err.message);
    }
  },

  /**
   * Record Storage Usage Metrics (GCS / Local storage MB).
   */
  async recordStorageUsage({ generationId, sizeMb = 10 }) {
    if (!generationId) return;

    const sizeGb = sizeMb / 1024;
    const costUsd = sizeGb * PRICING_CONFIG.STORAGE.pricePerGbMonth;

    try {
      await query(
        `UPDATE studio_generation_costs
         SET storage_mb = COALESCE(storage_mb, 0) + $2,
             storage_cost_usd = COALESCE(storage_cost_usd, 0) + $3
         WHERE generation_id = $1;`,
        [generationId, sizeMb, costUsd]
      );

      await this.recalculateTotalCost(generationId);
    } catch (err) {
      console.error(`[PRODUCTION LEDGER ERROR] recordStorageUsage failed:`, err.message);
    }
  },

  /**
   * Recalculate total USD & INR cost for a generation run.
   */
  async recalculateTotalCost(generationId) {
    if (!generationId) return;

    try {
      const res = await query(
        `SELECT gemini_cost_usd, imagen_cost_usd, veo_cost_usd, stt_cost_usd, dubbing_cost_usd, voice_cost_usd, storage_cost_usd
         FROM studio_generation_costs
         WHERE generation_id = $1;`,
        [generationId]
      );

      if (res.rows.length > 0) {
        const row = res.rows[0];
        const totalUsd =
          parseFloat(row.gemini_cost_usd || 0) +
          parseFloat(row.imagen_cost_usd || 0) +
          parseFloat(row.veo_cost_usd || 0) +
          parseFloat(row.stt_cost_usd || 0) +
          parseFloat(row.dubbing_cost_usd || 0) +
          parseFloat(row.voice_cost_usd || 0) +
          parseFloat(row.storage_cost_usd || 0);

        const totalInr = totalUsd * PRICING_CONFIG.USD_TO_INR_RATE;

        await query(
          `UPDATE studio_generation_costs
           SET total_cost_usd = $2,
               total_cost_inr = $3
           WHERE generation_id = $1;`,
          [generationId, totalUsd, totalInr]
        );
      }
    } catch (err) {
      console.error(`[PRODUCTION LEDGER ERROR] recalculateTotalCost failed:`, err.message);
    }
  },

  /**
   * Finalize a ledger generation record.
   */
  async finalizeLedger(generationId, status = 'COMPLETED') {
    if (!generationId) return;

    try {
      await this.recalculateTotalCost(generationId);
      await query(
        `UPDATE studio_generation_costs
         SET status = $2
         WHERE generation_id = $1;`,
        [generationId, status]
      );
      console.log(`[PRODUCTION LEDGER] Finalized GenID: ${generationId} with Status: ${status}`);
    } catch (err) {
      console.error(`[PRODUCTION LEDGER ERROR] finalizeLedger failed:`, err.message);
    }
  },

  /**
   * Admin Budget & Production Cost Dashboard Analytics (Aggregated & Per-User Breakdown).
   */
  async getAdminDashboardSummary() {
    try {
      // 1. Overall Aggregated Telemetry Totals
      const totalsRes = await query(`
        SELECT 
          COUNT(*)::int AS total_generations,
          COALESCE(SUM(gemini_input_tokens), 0)::bigint AS total_gemini_input_tokens,
          COALESCE(SUM(gemini_output_tokens), 0)::bigint AS total_gemini_output_tokens,
          COALESCE(SUM(gemini_cost_usd), 0)::numeric(12,4) AS total_gemini_cost_usd,
          COALESCE(SUM(imagen_generated), 0)::int AS total_imagen_generated,
          COALESCE(SUM(imagen_cost_usd), 0)::numeric(12,4) AS total_imagen_cost_usd,
          COALESCE(SUM(veo_seconds), 0)::numeric(12,2) AS total_veo_seconds,
          COALESCE(SUM(veo_cost_usd), 0)::numeric(12,4) AS total_veo_cost_usd,
          COALESCE(SUM(stt_minutes), 0)::numeric(12,2) AS total_stt_minutes,
          COALESCE(SUM(stt_cost_usd), 0)::numeric(12,4) AS total_stt_cost_usd,
          COALESCE(SUM(dubbing_minutes), 0)::numeric(12,2) AS total_dubbing_minutes,
          COALESCE(SUM(dubbing_cost_usd), 0)::numeric(12,4) AS total_dubbing_cost_usd,
          COALESCE(SUM(voice_clone_samples), 0)::int AS total_voice_clone_samples,
          COALESCE(SUM(tts_characters), 0)::bigint AS total_tts_characters,
          COALESCE(SUM(voice_cost_usd), 0)::numeric(12,4) AS total_voice_cost_usd,
          COALESCE(SUM(total_cost_usd), 0)::numeric(12,4) AS overall_cost_usd,
          COALESCE(SUM(total_cost_inr), 0)::numeric(12,2) AS overall_cost_inr
        FROM studio_generation_costs;
      `);

      // 2. Per-User Cost & Usage Breakdown
      const perUserRes = await query(`
        SELECT 
          COALESCE(c.user_id::text, 'guest') AS user_id,
          COALESCE(c.user_email, u.email, 'guest@autocaptions.local') AS user_email,
          COALESCE(u.name, 'Guest User') AS user_name,
          COUNT(c.id)::int AS total_generations,
          COALESCE(SUM(c.gemini_input_tokens + c.gemini_output_tokens), 0)::bigint AS total_gemini_tokens,
          COALESCE(SUM(c.imagen_generated), 0)::int AS imagen_count,
          COALESCE(SUM(c.veo_seconds), 0)::numeric(10,1) AS veo_seconds,
          COALESCE(SUM(c.stt_minutes), 0)::numeric(10,1) AS stt_minutes,
          COALESCE(SUM(c.dubbing_minutes), 0)::numeric(10,1) AS dubbing_minutes,
          COALESCE(SUM(c.tts_characters), 0)::bigint AS tts_characters,
          COALESCE(SUM(c.total_cost_usd), 0)::numeric(12,4) AS user_cost_usd,
          COALESCE(SUM(c.total_cost_inr), 0)::numeric(12,2) AS user_cost_inr
        FROM studio_generation_costs c
        LEFT JOIN users u ON c.user_id = u.id
        GROUP BY c.user_id, c.user_email, u.name, u.email
        ORDER BY user_cost_usd DESC;
      `);

      // 3. Recent Generation History
      const recentRes = await query(`
        SELECT 
          c.generation_id,
          c.feature_type,
          COALESCE(c.user_email, 'guest@autocaptions.local') AS user_email,
          c.gemini_model,
          c.gemini_input_tokens + c.gemini_output_tokens AS total_gemini_tokens,
          c.imagen_generated,
          c.veo_seconds,
          c.stt_minutes,
          c.dubbing_minutes,
          c.tts_characters,
          c.total_cost_usd,
          c.total_cost_inr,
          c.status,
          c.created_at
        FROM studio_generation_costs c
        ORDER BY c.created_at DESC
        LIMIT 50;
      `);

      return {
        summary: totalsRes.rows[0] || {},
        userBreakdown: perUserRes.rows || [],
        recentGenerations: recentRes.rows || [],
        pricingConfig: PRICING_CONFIG
      };
    } catch (err) {
      console.error(`[PRODUCTION LEDGER ERROR] getAdminDashboardSummary failed:`, err.message);
      throw err;
    }
  }
};

export default productionLedgerService;
