import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// Built-in high quality neural voice defaults for Edge-TTS
const EDGE_VOICE_MAP = {
  te: 'te-IN-MohanNeural',       // Telugu Male
  'te-female': 'te-IN-ShrutiNeural', // Telugu Female
  hi: 'hi-IN-MadhurNeural',      // Hindi Male
  'hi-female': 'hi-IN-SwaraNeural',  // Hindi Female
  en: 'en-IN-PrabhatNeural',     // Indian English Male
  'en-us': 'en-US-GuyNeural',    // US English Male
};

/**
 * Synthesize speech using Microsoft Edge-TTS (100% Free & Unlimited)
 * @param {Object} params
 * @param {string} params.text - Script to synthesize
 * @param {string} params.targetLanguage - ISO language code ('te', 'hi', 'en', etc.)
 * @param {string} params.outputPath - Absolute file path to save destination MP3
 * @param {string} [params.voiceId] - Optional explicit Edge-TTS voice identifier
 */
export async function synthesizeWithEdgeTTS({ text, targetLanguage = 'te', outputPath, voiceId }) {
  if (!text || !text.trim()) {
    throw new Error('[Edge-TTS] Text parameter is required');
  }

  let detectedLang = targetLanguage;
  if (/[\u0C00-\u0C7F]/.test(text)) {
    detectedLang = 'te';
  } else if (/[\u0900-\u097F]/.test(text)) {
    detectedLang = 'hi';
  }

  const selectedVoice = voiceId || EDGE_VOICE_MAP[detectedLang] || EDGE_VOICE_MAP[targetLanguage] || EDGE_VOICE_MAP.en;
  
  const absoluteOutputPath = path.resolve(outputPath);
  const outDir = path.dirname(absoluteOutputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Escape double quotes safely for CLI execution
  const safeText = text.replace(/"/g, '\\"').replace(/\n/g, ' ');
  const cmdDirect = `edge-tts --voice ${selectedVoice} --text "${safeText}" --write-media "${absoluteOutputPath}"`;
  const cmdPython = `python3 -m edge_tts --voice ${selectedVoice} --text "${safeText}" --write-media "${absoluteOutputPath}"`;

  try {
    try {
      await execPromise(cmdDirect);
    } catch {
      await execPromise(cmdPython);
    }

    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      console.log(`[Edge-TTS] ✅ Audio generated successfully: ${outputPath} (${selectedVoice})`);
      return outputPath;
    }
    throw new Error('[Edge-TTS] Generated file is missing or empty');
  } catch (err) {
    console.error(`[Edge-TTS ERROR] Synthesis failed for voice ${selectedVoice}: ${err.message}`);
    throw err;
  }
}
