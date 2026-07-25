/**
 * STT Provider — Abstract Base Class
 *
 * Defines the contract for all Speech-to-Text providers.
 * Every provider must implement the `transcribe()` method and return
 * results in the standardized WordTimestamp format.
 *
 * This abstraction allows us to swap providers without touching
 * any upstream business logic:
 *
 *   LocalWhisperProvider  → ₹0 development/testing
 *   DeepgramProvider      → production (fast, accurate, paid)
 *   GoogleSTTProvider     → production alternative
 *
 * The pipeline doesn't care which provider is active —
 * it always receives the same data shape.
 */

/**
 * @typedef {Object} WordTimestamp
 * @property {string} word       - The transcribed word
 * @property {number} start      - Start time in seconds
 * @property {number} end        - End time in seconds
 * @property {number} confidence - Confidence score (0.0 – 1.0)
 */

/**
 * @typedef {Object} TranscriptionResult
 * @property {string}           fullText   - Complete transcription text
 * @property {WordTimestamp[]}  words      - Word-level timestamps
 * @property {string}           language   - Detected primary language code (e.g. 'en', 'hi', 'te')
 * @property {number}           duration   - Audio duration in seconds
 * @property {string}           provider   - Provider name (e.g. 'local-whisper', 'deepgram')
 */

export class STTProvider {
  /**
   * @param {string} name - Provider identifier
   */
  constructor(name) {
    if (new.target === STTProvider) {
      throw new Error('STTProvider is abstract and cannot be instantiated directly.');
    }
    this.name = name;
  }

  /**
   * Transcribe an audio file and return word-level timestamps.
   *
   * @param {string} audioPath - Absolute path to the audio file (WAV, 16kHz mono)
   * @param {Object} [options]
   * @param {string} [options.language]    - Language hint (e.g. 'en', 'hi', 'te')
   * @param {boolean} [options.translate]  - Whether to translate to English
   * @returns {Promise<TranscriptionResult>}
   */
  async transcribe(audioPath, options = {}) {
    throw new Error(`${this.name}: transcribe() must be implemented by subclass.`);
  }

  /**
   * Check if this provider is available and configured.
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    throw new Error(`${this.name}: isAvailable() must be implemented by subclass.`);
  }
}
