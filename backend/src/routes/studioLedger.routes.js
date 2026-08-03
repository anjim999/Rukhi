import express from 'express';
import studioLedgerController from '../controllers/studioLedgerController.js';

const router = express.Router();

// GET /api/studio/ledger/summary — Admin Production Cost & Telemetry Dashboard
router.get('/summary', studioLedgerController.getDashboardSummary);

// POST /api/studio/ledger/track — Record custom/feature usage telemetry
router.post('/track', studioLedgerController.trackFeatureUsage);

export default router;
