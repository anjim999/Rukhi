import express from 'express';
import { generateDubbing, getEngines, transcribeSpeechInput } from '../controllers/dubbingController.js';
import { uploadAudio } from '../utils/fileUpload.js';

const router = express.Router();

router.post('/generate', generateDubbing);
router.get('/engines', getEngines);
router.post('/transcribe-speech', uploadAudio.single('audio'), transcribeSpeechInput);

export default router;
