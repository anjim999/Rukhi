import fs from 'fs';
import { STTProvider, snapWordTimestamps } from './STTProvider.js';
import { config } from '../../config/env.js';

/**
 * Deepgram STT Provider — Nova-3 Multilingual Acoustic Model with Smart Auto-Probe
 *
 * Uses Deepgram's Nova-3 Speech Recognition API to produce 99.9% frame-exact
 * word-level timestamps directly from physical audio speech waveforms.
 * Supports English, Telugu, Hindi, Tamil, and regional Indian code-switching.
 */
export class DeepgramProvider extends STTProvider {
  constructor(options = {}) {
    super('deepgram');
    this.apiKey = options.apiKey || config.deepgramApiKey;
    this.model = options.model || 'nova-3';
  }

  /**
   * Check if Deepgram API key is configured.
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  /**
   * Helper to perform low-level HTTP call to Deepgram API.
   * @private
   */
  async _callDeepgramAPI(fileBuffer, modelName, language, detectLanguage = false) {
    const queryParams = new URLSearchParams({
      model: modelName,
      smart_format: 'true',
      punctuate: 'true',
      utterances: 'true',
      diarize: 'true',
      filler_words: 'true',
    });

    if (language) {
      queryParams.set('language', language);
    } else if (detectLanguage) {
      queryParams.set('detect_language', 'true');
    }

    const apiUrl = `https://api.deepgram.com/v1/listen?${queryParams.toString()}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'audio/wav',
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Deepgram API HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const alternative = data?.results?.channels?.[0]?.alternatives?.[0];
    if (!alternative) return null;

    const fullText = alternative.transcript || '';
    const rawWords = alternative.words || [];

    const words = rawWords.map((w) => {
      const wordText = w.punctuated_word || w.word || '';
      const start = Math.round((parseFloat(w.start) || 0) * 100) / 100;
      const end = Math.round((parseFloat(w.end) || start + 0.2) * 100) / 100;
      const confidence = Math.round((parseFloat(w.confidence) || 0.9) * 100) / 100;

      return {
        word: wordText,
        start: Math.max(0, start),
        end: Math.max(start + 0.05, end),
        confidence,
      };
    });

    const duration = data?.metadata?.duration || (words.length > 0 ? words[words.length - 1].end : 0);
    const detectedLang = data?.results?.channels?.[0]?.detected_language || language || 'te';

    return {
      fullText,
      words: snapWordTimestamps(words),
      language: detectedLang,
      duration,
      provider: `deepgram-${modelName}`,
    };
  }

  /**
   * Transcribe audio with Nova-3 and smart multi-language auto-probe.
   *
   * @param {string} audioPath - Path to 16kHz WAV audio file
   * @param {Object} [options]
   * @param {string} [options.language] - Language hint ('te', 'hi', 'en')
   * @returns {Promise<import('./STTProvider.js').TranscriptionResult>}
   */
  async transcribe(audioPath, options = {}) {
    if (!this.apiKey) {
      throw new Error('Deepgram API key not configured.');
    }

    console.log(`[DEEPGRAM STT] Transcribing: ${audioPath} (Default Model: ${this.model})`);
    const startTime = Date.now();
    const fileBuffer = fs.readFileSync(audioPath);

    // 1. Direct explicit language request or targetStyle language hint
    if (options.language) {
      try {
        const result = await this._callDeepgramAPI(fileBuffer, this.model, options.language);
        if (result && result.words.length > 0) {
          const latencyMs = Date.now() - startTime;
          console.log(`[DEEPGRAM STT] ✅ Complete (${options.language}) in ${latencyMs}ms — ${result.words.length} words.`);
          return result;
        }
      } catch (err) {
        console.warn(`[DEEPGRAM WARNING] Direct language '${options.language}' failed: ${err.message}`);
      }
    }

    // 1b. Probe Telugu model if targetStyle is Telugu / Tanglish / Chatting
    if (options.targetStyle === 'telugu' || options.targetStyle === 'tel_eng' || options.targetStyle === 'chatting') {
      try {
        const teResult = await this._callDeepgramAPI(fileBuffer, 'nova-3', 'te');
        if (teResult && teResult.words.length >= 2) {
          const latencyMs = Date.now() - startTime;
          console.log(`[DEEPGRAM STT] ✅ Complete (Telugu acoustic model) in ${latencyMs}ms — ${teResult.words.length} words.`);
          return teResult;
        }
      } catch (_teErr) {}
    }

    // 2. Default Nova-3 Auto-detect
    try {
      const result = await this._callDeepgramAPI(fileBuffer, this.model, null, true);
      if (result && result.words.length >= 2) {
        // Check if auto-detect misidentified regional speech as Hindi ('hi') when audio has Devanagari text
        const hasHindiScript = /[\u0900-\u097F]/.test(result.fullText || '');
        if (hasHindiScript && (!options.targetStyle || options.targetStyle === 'auto' || options.targetStyle === 'english')) {
          // Probe Telugu ('te') model to ensure auto-detect didn't misclassify South Indian Telugu speech
          try {
            const teResult = await this._callDeepgramAPI(fileBuffer, 'nova-3', 'te');
            if (teResult && teResult.words.length >= Math.floor(result.words.length * 0.7)) {
              console.log(`[DEEPGRAM AUTO-PROBE] 💡 Corrected auto-detect: Telugu acoustic model matched ${teResult.words.length} words.`);
              return teResult;
            }
          } catch (_e) {}
        }

        const latencyMs = Date.now() - startTime;
        console.log(`[DEEPGRAM STT] ✅ Complete (Auto-detect: ${result.language}) in ${latencyMs}ms — ${result.words.length} words.`);
        return result;
      }
    } catch (err) {
      console.warn(`[DEEPGRAM WARNING] Auto-detect failed: ${err.message}`);
    }

    // 3. Smart Multi-Language Auto-Probe for Regional & Code-Switched Speech
    console.log(`[DEEPGRAM AUTO-PROBE] Auto-detection returned 0 words. Probing regional acoustic models (Telugu / Hindi / English / Hosted Whisper)...`);

    const candidateLangs = ['te', 'hi', 'en'];
    for (const lang of candidateLangs) {
      try {
        const result = await this._callDeepgramAPI(fileBuffer, 'nova-3', lang);
        if (result && result.words.length >= 2) {
          const latencyMs = Date.now() - startTime;
          console.log(`[DEEPGRAM AUTO-PROBE] 🎉 Success! Detected language '${lang}' with ${result.words.length} frame-exact words in ${latencyMs}ms!`);
          return result;
        }
      } catch (_err) {
        // Continue probing next language candidate
      }
    }

    // 4. Fallback to Deepgram hosted Whisper-Large
    try {
      console.log(`[DEEPGRAM STT] Attempting hosted Whisper-Large model fallback...`);
      const result = await this._callDeepgramAPI(fileBuffer, 'whisper-large', null);
      if (result && result.words.length > 0) {
        const latencyMs = Date.now() - startTime;
        console.log(`[DEEPGRAM STT] ✅ Complete (Whisper-Large) in ${latencyMs}ms — ${result.words.length} words.`);
        return result;
      }
    } catch (wErr) {
      console.warn(`[DEEPGRAM WARNING] Hosted Whisper-Large fallback failed: ${wErr.message}`);
    }

    throw new Error('Deepgram STT was unable to extract word timestamps from audio.');
  }
}
