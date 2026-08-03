import productionLedgerService from '../services/studio/productionLedgerService.js';

/**
 * Controller for Rukhi Studio Production Cost Ledger & Admin Telemetry Dashboard.
 */
export const studioLedgerController = {
  /**
   * GET /api/studio/ledger/summary
   * Returns aggregated totals, per-user cost breakdown, and recent generation metrics.
   */
  async getDashboardSummary(req, res) {
    try {
      const summaryData = await productionLedgerService.getAdminDashboardSummary();
      return res.status(200).json({
        success: true,
        data: summaryData
      });
    } catch (err) {
      console.error('[STUDIO LEDGER CONTROLLER ERROR]:', err.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch production telemetry summary',
        details: err.message
      });
    }
  },

  /**
   * POST /api/studio/ledger/track
   * Manually record or trigger feature usage telemetry (Captions, STT, Dubbing, Voice Clone).
   */
  async trackFeatureUsage(req, res) {
    try {
      const {
        generationId,
        userId,
        userEmail,
        featureType,
        sttMinutes,
        dubbingMinutes,
        voiceSamples,
        ttsCharacters,
        storageMb
      } = req.body;

      const genId = generationId || `manual_${Date.now()}`;
      await productionLedgerService.startLedger({
        generationId: genId,
        userId: userId || req.user?.id || null,
        userEmail: userEmail || req.user?.email || null,
        featureType: featureType || 'general_feature'
      });

      if (sttMinutes) {
        await productionLedgerService.recordSttUsage({ generationId: genId, minutes: parseFloat(sttMinutes) });
      }
      if (dubbingMinutes) {
        await productionLedgerService.recordDubbingUsage({ generationId: genId, minutes: parseFloat(dubbingMinutes) });
      }
      if (voiceSamples || ttsCharacters) {
        await productionLedgerService.recordVoiceUsage({
          generationId: genId,
          samples: parseInt(voiceSamples || 0, 10),
          characters: parseInt(ttsCharacters || 0, 10)
        });
      }
      if (storageMb) {
        await productionLedgerService.recordStorageUsage({ generationId: genId, sizeMb: parseFloat(storageMb) });
      }

      await productionLedgerService.finalizeLedger(genId);

      return res.status(200).json({
        success: true,
        message: 'Feature telemetry recorded successfully',
        generationId: genId
      });
    } catch (err) {
      console.error('[STUDIO LEDGER CONTROLLER ERROR]:', err.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to record feature usage telemetry',
        details: err.message
      });
    }
  }
};

export default studioLedgerController;
