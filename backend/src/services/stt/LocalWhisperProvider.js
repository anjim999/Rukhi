import { spawn } from 'child_process';
import { STTProvider } from './STTProvider.js';

/**
 * Local Whisper STT Provider
 *
 * Uses OpenAI's Whisper model running locally via the `whisper` CLI
 * (installed via `pip install openai-whisper`).
 *
 * This provider costs ₹0 — perfect for development and testing.
 * For production, swap to DeepgramProvider or GoogleSTTProvider.
 *
 * Requirements:
 *   pip install openai-whisper
 *   (or) pip install faster-whisper   (GPU-accelerated alternative)
 *
 * The CLI is invoked as a child process to avoid Python<->Node binding issues.
 * Output is parsed from Whisper's JSON format into our standardized WordTimestamp format.
 */

export class LocalWhisperProvider extends STTProvider {
  /**
   * @param {Object} [options]
   * @param {string} [options.modelSize='base'] - Whisper model size: tiny, base, small, medium, large
   * @param {string} [options.device='cpu']      - 'cpu' or 'cuda'
   */
  constructor(options = {}) {
    super('local-whisper');
    this.modelSize = options.modelSize || 'base';
    this.device = options.device || 'cpu';
  }

  /**
   * Check if the whisper CLI is available on this machine.
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    return new Promise((resolve) => {
      const proc = spawn('whisper', ['--help']);
      proc.on('close', (code) => resolve(code === 0));
      proc.on('error', () => resolve(false));
    });
  }

  /**
   * Transcribe audio using the local Whisper CLI.
   *
   * @param {string} audioPath - Path to WAV audio file (16kHz mono)
   * @param {Object} [options]
   * @param {string} [options.language] - Language hint (e.g. 'en', 'hi', 'te')
   * @returns {Promise<import('./STTProvider.js').TranscriptionResult>}
   */
  async transcribe(audioPath, options = {}) {
    console.log(`[WHISPER] Transcribing: ${audioPath} (model: ${this.modelSize}, device: ${this.device})`);

    const args = [
      audioPath,
      '--model', this.modelSize,
      '--device', this.device,
      '--output_format', 'json',
      '--word_timestamps', 'True',
      '--output_dir', '/tmp/whisper_out',
    ];

    if (options.language) {
      args.push('--language', options.language);
    }

    const rawOutput = await this._runWhisper(args);
    const parsed = this._parseWhisperOutput(rawOutput);

    console.log(`[WHISPER] Transcription complete: ${parsed.words.length} words, language: ${parsed.language}`);
    return parsed;
  }

  /**
   * Run the whisper CLI and capture the JSON output.
   * @param {string[]} args
   * @returns {Promise<Object>} - Parsed JSON from whisper output
   * @private
   */
  _runWhisper(args) {
    return new Promise((resolve, reject) => {
      const proc = spawn('whisper', args);
      let stderr = '';

      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Whisper exited with code ${code}: ${stderr.substring(0, 500)}`));
        }

        // Whisper writes JSON to the output directory
        // Read the output file
        const fs = require('fs');
        const path = require('path');
        const baseName = path.basename(args[0], path.extname(args[0]));
        const jsonPath = path.join('/tmp/whisper_out', `${baseName}.json`);

        try {
          const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
          resolve(JSON.parse(jsonContent));
        } catch (err) {
          reject(new Error(`Failed to read Whisper output: ${err.message}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Whisper process error: ${err.message}`));
      });
    });
  }

  /**
   * Parse Whisper's raw JSON output into our standardized TranscriptionResult.
   *
   * Whisper JSON format:
   * {
   *   "text": "full transcript...",
   *   "segments": [{ "start": 0.0, "end": 2.5, "text": "...", "words": [...] }],
   *   "language": "en"
   * }
   *
   * @param {Object} whisperOutput - Raw parsed JSON from whisper
   * @returns {import('./STTProvider.js').TranscriptionResult}
   * @private
   */
  _parseWhisperOutput(whisperOutput) {
    const words = [];

    if (whisperOutput.segments) {
      for (const segment of whisperOutput.segments) {
        if (segment.words && Array.isArray(segment.words)) {
          for (const w of segment.words) {
            words.push({
              word: (w.word || '').trim(),
              start: Math.round((w.start || 0) * 1000) / 1000,
              end: Math.round((w.end || 0) * 1000) / 1000,
              confidence: w.probability != null ? Math.round(w.probability * 1000) / 1000 : 0.9,
            });
          }
        }
      }
    }

    // Calculate total duration from the last word
    const duration = words.length > 0 ? words[words.length - 1].end : 0;

    return {
      fullText: (whisperOutput.text || '').trim(),
      words,
      language: whisperOutput.language || 'en',
      duration,
      provider: this.name,
    };
  }
}
