import path from 'path';
import { config } from '../../config/env.js';
import { synthesizeSpeech, TTS_PROVIDERS } from './tts/ttsEngineManager.js';

/**
 * AI Translated Voiceover Dubbing Service
 * Generates translated spoken audio matching the new subtitle script using the Multi-Engine Architecture.
 * 
 * @param {Object} params
 * @param {string} params.text - Script to synthesize
 * @param {string} params.targetLanguage - Destination language ('te', 'hi', 'en', etc.)
 * @param {string} params.projectId - Unique project identifier
 * @param {string} [params.provider] - Optional explicit provider ('edge', 'google', 'indic_tts', 'xtts', 'f5_bark', 'elevenlabs')
 * @param {string} [params.voiceId] - Optional voice ID
 * @param {string} [params.speakerWavPath] - Optional reference audio path for voice cloning (XTTS)
 */
export async function generateDubbedVoiceoverAudio({
  text,
  targetLanguage = 'en',
  projectId,
  provider = process.env.DEFAULT_TTS_PROVIDER || TTS_PROVIDERS.EDGE,
  voiceId,
  speakerWavPath,
}) {
  if (!text || !text.trim()) {
    return null;
  }

  const outputPath = path.join(config.uploadDir, `${projectId}_dubbed_${targetLanguage}.mp3`);

  try {
    const resultPath = await synthesizeSpeech({
      text,
      targetLanguage,
      outputPath,
      provider,
      voiceId,
      speakerWavPath,
    });

    console.log(`[DUBBING SERVICE] ✅ Dubbed audio generated successfully: ${resultPath}`);
    return resultPath;
  } catch (err) {
    console.error(`[DUBBING ERROR] Audio generation failed: ${err.message}`);
    return null;
  }
}
