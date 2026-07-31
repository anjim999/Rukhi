import express from 'express';
import {
  autoDetectBRoll,
  searchBRoll,
  generateFacelessReel,
  generateScriptOnly,
  getReelStatus,
  getEngineHealth,
} from '../controllers/brollController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/auto-detect', optionalAuth, autoDetectBRoll);
router.get('/search', searchBRoll);
router.post('/generate-script', optionalAuth, generateScriptOnly);
router.post('/generate-faceless', optionalAuth, generateFacelessReel);
router.get('/reel-status/:id', getReelStatus);
router.get('/health', getEngineHealth);

export default router;
