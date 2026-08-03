/**
 * Rukhi Production Cost & Pricing Configuration
 * Centralized configurable rates for all AI models, speech services, dubbing, voice cloning, and storage.
 * Prices can be dynamically overridden via environment variables.
 */

export const PRICING_CONFIG = {
  // USD to INR Exchange Rate
  USD_TO_INR_RATE: parseFloat(process.env.USD_TO_INR_RATE || '84.00'),

  // 1. Gemini LLMs (per 1,000,000 tokens)
  GEMINI_25_FLASH: {
    inputPricePerMillion: parseFloat(process.env.GEMINI_FLASH_INPUT_PER_M || '0.075'),
    outputPricePerMillion: parseFloat(process.env.GEMINI_FLASH_OUTPUT_PER_M || '0.30'),
  },
  GEMINI_15_PRO: {
    inputPricePerMillion: parseFloat(process.env.GEMINI_PRO_INPUT_PER_M || '1.25'),
    outputPricePerMillion: parseFloat(process.env.GEMINI_PRO_OUTPUT_PER_M || '5.00'),
  },

  // 2. Image Generation (per image)
  IMAGEN_3: {
    pricePerImage: parseFloat(process.env.IMAGEN3_PRICE_PER_IMAGE || '0.03'),
  },

  // 3. Video Generation (per second)
  VEO_3: {
    pricePerSecond: parseFloat(process.env.VEO_PRICE_PER_SECOND || '0.03'),
  },

  // 4. Speech-To-Text (Deepgram / Whisper) (per minute)
  STT_DEEPGRAM: {
    pricePerMinute: parseFloat(process.env.STT_DEEPGRAM_PER_MIN || '0.0043'),
  },
  STT_WHISPER: {
    pricePerMinute: parseFloat(process.env.STT_WHISPER_PER_MIN || '0.006'),
  },

  // 5. Audio Dubbing & Stem Isolation (Demucs) (per minute)
  DUBBING_DEMUCS: {
    pricePerMinute: parseFloat(process.env.DUBBING_PER_MIN || '0.015'),
  },

  // 6. Voice Cloning & TTS (Chirp / ElevenLabs) (per 1,000 characters)
  VOICE_CLONING: {
    pricePerSample: parseFloat(process.env.VOICE_CLONING_PER_SAMPLE || '0.05'),
    ttsPricePer1kChars: parseFloat(process.env.TTS_PER_1K_CHARS || '0.016'),
  },

  // 7. GCS / Local Storage (per GB per month)
  STORAGE: {
    pricePerGbMonth: parseFloat(process.env.STORAGE_PER_GB_MONTH || '0.020'),
  }
};

export default PRICING_CONFIG;
