import express from 'express';
import { autoDetectBRoll, searchBRoll, generateFacelessReel, generateScriptOnly } from '../controllers/brollController.js';

const router = express.Router();

router.post('/auto-detect', autoDetectBRoll);
router.get('/search', searchBRoll);
router.post('/generate-script', generateScriptOnly);
router.post('/generate-faceless', generateFacelessReel);

export default router;
