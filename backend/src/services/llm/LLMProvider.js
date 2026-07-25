/**
 * LLM Provider — Abstract Base Class
 *
 * Defines the contract for all LLM providers used in the Caption Director pipeline.
 * Every provider must implement `generateCaptionTimeline()` which takes raw
 * word timestamps + ML signals and returns a structured CaptionTimeline JSON.
 *
 * This abstraction enables seamless provider swapping:
 *
 *   GeminiCaptionDirector  → primary (multilingual, code-switching)
 *   OpenAICaptionDirector  → fallback / comparison
 *
 * The worker pipeline calls the active provider — it never knows or cares
 * which LLM is generating the captions.
 */

/**
 * @typedef {Object} CaptionDirectorInput
 * @property {import('../stt/STTProvider.js').WordTimestamp[]} words     - Word-level timestamps from STT
 * @property {string}   fullText    - Full transcription text
 * @property {string}   language    - Detected language code
 * @property {number}   duration    - Audio duration in seconds
 * @property {number[]} [emphasisScores] - ML-generated emphasis scores per word (0.0–1.0)
 * @property {string}   [aspectRatio]    - Target video aspect ratio ('9:16', '16:9', '1:1')
 * @property {string}   [presetName]     - Desired style preset name
 */

/**
 * @typedef {Object} CaptionDirectorOutput
 * @property {import('../../../../shared/constants/timeline.js').CaptionTimeline} timeline - Full CaptionTimeline JSON
 * @property {string} provider  - Provider name
 * @property {number} latencyMs - Time taken for LLM inference in milliseconds
 */

export class LLMProvider {
  /**
   * @param {string} name - Provider identifier
   */
  constructor(name) {
    if (new.target === LLMProvider) {
      throw new Error('LLMProvider is abstract and cannot be instantiated directly.');
    }
    this.name = name;
  }

  /**
   * Generate a structured CaptionTimeline from raw STT words + ML signals.
   *
   * @param {CaptionDirectorInput} input
   * @returns {Promise<CaptionDirectorOutput>}
   */
  async generateCaptionTimeline(input) {
    throw new Error(`${this.name}: generateCaptionTimeline() must be implemented by subclass.`);
  }

  /**
   * Check if this provider is properly configured (API key set, etc).
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    throw new Error(`${this.name}: isAvailable() must be implemented by subclass.`);
  }
}
