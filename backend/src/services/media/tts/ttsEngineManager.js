import { synthesizeWithEdgeTTS } from './edgeTTSEngine.js';
import { synthesizeWithGoogleTTS } from './googleTTSEngine.js';
import { synthesizeWithIndicTTS } from './indicTTSEngine.js';
import { synthesizeWithXTTS } from './xttsEngine.js';
import { synthesizeWithF5Bark } from './f5BarkEngine.js';
import { synthesizeWithElevenLabs } from './elevenLabsEngine.js';

export const TTS_PROVIDERS = {
  EDGE: 'edge',
  GOOGLE: 'google',
  INDIC: 'indic_tts',
  XTTS: 'xtts',
  F5_BARK: 'f5_bark',
  ELEVENLABS: 'elevenlabs',
};

/**
 * Unified Multi-Engine TTS Dispatcher with Automatic Fallback Chain
 */
export async function synthesizeSpeech({
  text,
  targetLanguage = 'te',
  outputPath,
  provider = TTS_PROVIDERS.EDGE,
  voiceId,
  speakerWavPath,
  gender,
}) {
  if (!text || !text.trim()) {
    throw new Error('[TTS Engine Manager] Text parameter cannot be empty');
  }

  const primaryEngineMap = {
    [TTS_PROVIDERS.EDGE]: () => synthesizeWithEdgeTTS({ text, targetLanguage, outputPath, voiceId }),
    [TTS_PROVIDERS.GOOGLE]: () => synthesizeWithGoogleTTS({ text, targetLanguage, outputPath, voiceId }),
    [TTS_PROVIDERS.INDIC]: () => synthesizeWithIndicTTS({ text, targetLanguage, outputPath, gender }),
    [TTS_PROVIDERS.XTTS]: () => synthesizeWithXTTS({ text, targetLanguage, speakerWavPath, outputPath }),
    [TTS_PROVIDERS.F5_BARK]: () => synthesizeWithF5Bark({ text, targetLanguage, outputPath }),
    [TTS_PROVIDERS.ELEVENLABS]: () => synthesizeWithElevenLabs({ text, targetLanguage, outputPath, voiceId }),
  };

  const primaryFunction = primaryEngineMap[provider] || primaryEngineMap[TTS_PROVIDERS.EDGE];

  // 1. Try Primary Chosen Provider Engine
  try {
    console.log(`[TTS Engine Manager] Synthesizing speech using provider: '${provider}' (${targetLanguage})`);
    return await primaryFunction();
  } catch (primaryError) {
    console.warn(`[TTS Engine Manager] Primary provider '${provider}' failed: ${primaryError.message}. Triggering fallback chain...`);
  }

  // 2. Fallback Tier 1: Google Cloud Neural2 (if different from primary)
  if (provider !== TTS_PROVIDERS.GOOGLE && (process.env.GOOGLE_TTS_API_KEY || process.env.GEMINI_API_KEY)) {
    try {
      console.log(`[TTS Engine Manager] 🔄 Fallback Tier 1: Attempting Google Cloud TTS...`);
      return await synthesizeWithGoogleTTS({ text, targetLanguage, outputPath });
    } catch (googleError) {
      console.warn(`[TTS Engine Manager] Google Cloud TTS fallback failed: ${googleError.message}`);
    }
  }

  // 3. Fallback Tier 2: Edge-TTS (100% Free, zero external credentials needed)
  try {
    console.log(`[TTS Engine Manager] 🔄 Fallback Tier 2: Attempting Edge-TTS ($0 cost fallback)...`);
    return await synthesizeWithEdgeTTS({ text, targetLanguage, outputPath });
  } catch (edgeError) {
    console.error(`[TTS Engine Manager] ❌ All fallback providers failed. Edge-TTS error: ${edgeError.message}`);
    throw new Error(`[TTS Engine Manager] Audio synthesis failed across all available providers: ${edgeError.message}`);
  }
}
