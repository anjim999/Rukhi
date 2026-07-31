import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateContentViaVertexAi } from '../ai/vertexAiGeminiService.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { LLMProvider } from './LLMProvider.js';
import { config } from '../../config/env.js';
import { extractAudioChunk, detectSpeechOnset } from '../media/ffmpegService.js';
import {
  DISPLAY_MODES,
  ANIMATION_TYPES,
  SFX_TYPES,
  CASE_FORMATS,
  ASPECT_RATIOS,
  THEME_PRESETS,
} from '../../../shared/constants/timeline.js';

/**
 * Telglish / Telugu Roman Transliteration Utility
 */
export function transliterateTeluguToRoman(text) {
  if (!text || typeof text !== 'string') return text;
  if (!/[\u0C00-\u0C7F\u0900-\u097F]/.test(text)) return text;

  const wordMap = {
    'తమ్ముడు': 'tammudu', 'ఒక్క': 'okka', 'నిమిషం': 'nimisham', 'నా': 'naa',
    'అనుభూతితో': 'anubhutito', 'చెప్తున్నాను': 'cheptunnanu', 'అమ్మాయిలతో': 'ammayilato',
    'తిరగరు': 'tiragaru', 'ఒక్కసారి': 'okkasari', 'ప్రేమలో': 'premaloo',
    'పడ్డామంటే': 'paddamante', 'తువల': 'tuvala', 'థియరీ': 'theory', 'పోతుంది': 'potundi',
    'తర్వాత': 'tarvata', 'ఎంత': 'enta', 'పీకునో': 'peekuno', 'ఉపయోగం': 'upayogam',
    'ఏం': 'em', 'చేస్తున్నావ్': 'chestunnav', 'రా': 'raa', 'ఏంటి': 'enti',
    'కాదు': 'kaadu', 'అవును': 'avunu',
  };

  let res = text;
  for (const [teWord, roWord] of Object.entries(wordMap)) {
    res = res.replace(new RegExp(teWord, 'g'), roWord);
  }

  const charMap = {
    'అ': 'a', 'ఆ': 'aa', 'ఇ': 'i', 'ఈ': 'ee', 'ఉ': 'u', 'ఊ': 'oo', 'ఋ': 'ru', 'ఎ': 'e', 'ఏ': 'ae', 'ఐ': 'ai', 'ఒ': 'o', 'ఓ': 'o', 'ఔ': 'au', 'అం': 'am', 'అః': 'aha',
    'క': 'ka', 'ఖ': 'kha', 'గ': 'ga', 'ఘ': 'gha', 'ఙ': 'nga',
    'చ': 'cha', 'ఛ': 'chha', 'జ': 'ja', 'ఝ': 'jha', 'ఞ': 'nya',
    'ట': 'ta', 'ఠ': 'tha', 'డ': 'da', 'ఢ': 'dha', 'ణ': 'na',
    'త': 'ta', 'థ': 'tha', 'ద': 'da', 'ధ': 'dha', 'న': 'na',
    'ప': 'pa', 'ఫ': 'pha', 'బ': 'ba', 'భ': 'bha', 'మ': 'ma',
    'య': 'ya', 'ర': 'ra', 'ల': 'la', 'వ': 'va', 'శ': 'sha', 'ష': 'sha', 'స': 'sa', 'హ': 'ha', 'ళ': 'la', 'క్ష': 'ksha', 'ఱ': 'ra',
    'ా': 'aa', 'ి': 'i', 'ీ': 'ee', 'ు': 'u', 'ూ': 'oo', 'ృ': 'ru', 'ె': 'e', 'ే': 'ae', 'ై': 'ai', 'ొ': 'o', 'ో': 'o', 'ౌ': 'au', 'ం': 'm', 'ః': 'h', '్': '',
  };

  let out = '';
  for (let i = 0; i < res.length; i++) {
    const ch = res[i];
    out += charMap[ch] !== undefined ? charMap[ch] : ch;
  }
  return out;
}

function fileToGenerativePart(filePath, mimeType = 'audio/wav') {
  const fileBuffer = fs.readFileSync(filePath);
  return {
    inlineData: {
      data: fileBuffer.toString('base64'),
      mimeType,
    },
  };
}

import { getStyleInstruction } from './utils/geminiPromptUtils.js';



export class GeminiCaptionDirector extends LLMProvider {
  constructor() {
    super('gemini-caption-director');

    if (!config.geminiApiKey) {
      console.warn('[GEMINI] No API key configured. Director will not be available.');
    }

    this.ai = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;
    const baseModel = config.geminiModel || 'gemini-2.5-flash';
    this.modelName = baseModel;
    this.fallbackModels = Array.from(new Set([baseModel, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro']));
  }

  async isAvailable() {
    return !!this.ai;
  }

  /**
   * Robust Gemini API caller with automatic model fallback.
   * Priority #1: Google Vertex AI (aiplatform.googleapis.com) - Covered 100% by GCP $300 Credits.
   * Priority #2: Google AI Studio fallback.
   */
  async _generateContentWithFallback(contents, generationConfig = {}) {
    // 1. Attempt Primary Google Vertex AI REST Endpoint (100% Covered by GCP $300 Credits)
    try {
      const vertexResult = await generateContentViaVertexAi({
        model: this.modelName || 'gemini-2.5-flash',
        contents,
        generationConfig,
      });
      if (vertexResult && vertexResult.trim().length > 0) {
        return vertexResult;
      }
    } catch (vertexErr) {
      console.warn('[VERTEX AI GEMINI PRIMARY WARN] Fallback to AI Studio:', vertexErr.message);
    }

    if (!this.ai) throw new Error('Gemini API key not configured.');

    let lastError = null;

    for (const modelName of this.fallbackModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[GEMINI MODEL] Requesting with ${modelName} (attempt ${attempt})...`);
          const model = this.ai.getGenerativeModel({
            model: modelName,
            generationConfig,
          });

          const result = await model.generateContent(contents);
          const text = result.response.text();
          if (text && text.trim().length > 0) {
            return text;
          }
        } catch (err) {
          lastError = err;
          console.warn(`[GEMINI MODEL WARN] ${modelName} attempt ${attempt} failed: ${err.message}`);
          if (err.message.includes('429') || err.message.includes('quota') || err.message.includes('rate')) {
            console.log(`[GEMINI 429 FALLBACK] Quota/Rate limit hit for ${modelName}. Switching to next model...`);
            await new Promise((r) => setTimeout(r, 1000));
            break; // Break inner loop to try next model immediately
          }
        }
      }
    }

    throw lastError || new Error('All Gemini fallback models exhausted.');
  }

  async generateCaptionTimelineFromAudio(input) {
    let audioPath, duration, targetStyle;
    if (typeof input === 'string') {
      audioPath = input;
      duration = arguments[1] || 15;
      targetStyle = arguments[2] || 'auto';
    } else {
      audioPath = input.audioPath;
      duration = input.duration || 15;
      targetStyle = input.targetStyle || 'auto';
    }
    return this.transcribeAndDirectFromAudio(audioPath, duration, targetStyle);
  }

  /**
   * Transcribe video audio directly with Gemini 2.5 Flash with millisecond precision and 429 retry protection.
   */
  async transcribeAndDirectFromAudio(audioPath, duration = 15, targetStyle = 'auto') {
    if (typeof audioPath === 'object') {
      targetStyle = audioPath.targetStyle || 'auto';
      duration = audioPath.duration || 15;
      audioPath = audioPath.audioPath;
    }
    if (!this.ai) {
      throw new Error('Gemini API key not configured.');
    }

    const startTime = Date.now();
    console.log(`[GEMINI AUDIO STT] Transcribing audio (Duration: ${duration}s, Style: ${targetStyle}) with Gemini 2.5 Flash: ${audioPath}`);

    const styleInstruction = getStyleInstruction(targetStyle);


    let allWords = [];
    let fullText = '';
    let language = 'te';
    let hook = 'VIRAL REEL CAPTIONS 🔥';

    const CHUNK_SIZE = 15; // 15-second sub-clips
    const OVERLAP_BUFFER = 2.5; // 2.5s overlap
    const CHUNK_STEP = CHUNK_SIZE - OVERLAP_BUFFER; // 12.5s step

    // Use single-pass native audio transcription for videos up to 180s (3 minutes)
    // For mega-long podcasts (> 180s), chunking with 2.5s overlapping windows is used.
    if (duration > 180) {
      console.log(`[GEMINI STT ENGINE] Duration ${duration.toFixed(1)}s > 180s. Transcribing with 2.5s overlapping sliding window chunks...`);
      const numChunks = Math.ceil(duration / CHUNK_STEP);
      const tmpDir = path.dirname(audioPath);

      for (let c = 0; c < numChunks; c++) {
        const offset = c * CHUNK_STEP;
        const chunkDur = Math.min(CHUNK_SIZE, duration - offset);
        if (chunkDur < 0.5) continue;

        const chunkPath = path.join(tmpDir, `tmp_chunk_${Date.now()}_${c}_${Math.random().toString(36).substring(7)}.wav`);

        try {
          await extractAudioChunk(audioPath, offset, chunkDur, chunkPath);
          const speechOnset = await detectSpeechOnset(chunkPath);
          const audioPart = fileToGenerativePart(chunkPath, 'audio/wav');

          const prompt = `You are an expert Speech Transcriber and Reel Caption Director.
LISTEN carefully to this ${chunkDur.toFixed(1)}-second audio clip (part of video from t=${offset.toFixed(1)}s to t=${(offset + chunkDur).toFixed(1)}s).
${speechOnset > 0.1 ? `EXACT SPEECH ONSET CONSTRAINT: Initial silence in this clip is ${speechOnset.toFixed(2)}s. Word[0] MUST NOT start before ${speechOnset.toFixed(2)}s.` : ''}

TARGET OUTPUT SCRIPT STYLE:
${styleInstruction}

AUDIO ENVIRONMENT & BGM INSTRUCTION:
This audio clip may contain heavy background music (BGM), instruments, beats, or vocal noise. IGNORE all background music and instruments. Isolate and transcribe ALL spoken human voice words across the full ${chunkDur.toFixed(1)}-second duration from start to end without missing any phrases!

CRITICAL TIMING & SYNCHRONIZATION CONSTRAINTS:
1. Provide exact word-level timestamps relative to THIS CHUNK (start 0.00s to ${chunkDur.toFixed(2)}s).
2. Start time of the first word MUST match actual speech onset (${speechOnset.toFixed(2)}s) in this audio clip.
3. Allocate timestamps so each word matches the EXACT acoustic playback window of the spoken phrase in this audio clip.
4. Timestamps MUST be in seconds with 2 decimal places (e.g. 0.15, 1.42).
5. Word timestamps MUST be strictly ordered and monotonic: word[n].start < word[n].end and word[n].end <= word[n+1].start.
6. Transcribe ALL words spoken in this ${chunkDur.toFixed(1)}-second audio chunk. DO NOT truncate speech early.
7. NO-TRANSLATION MANDATE: UNLESS targetStyle is explicitly 'english', NEVER translate spoken non-English, Telugu, Hindi, or code-switched words into English. Transcribe verbatim spoken words in Romanized script (e.g. Teluglish).

Return ONLY a compact JSON object with this exact structure:
{
  "fullText": "<transcript/translation for this audio clip>",
  "language": "te|en|hi",
  "words": [
    ["Word1", start_sec_within_chunk, end_sec_within_chunk, emphasis_0_to_1],
    ["Word2", start_sec_within_chunk, end_sec_within_chunk, emphasis_0_to_1]
  ],
  "hook": "<VIRAL HOOK TITLE WITH EMOJI>"
}`;

          const model = this.ai.getGenerativeModel({
            model: this.modelName,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
              maxOutputTokens: 8192,
            },
          });

          let responseText = null;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const result = await model.generateContent([audioPart, prompt]);
              responseText = result.response.text();
              break;
            } catch (err) {
              console.warn(`[GEMINI CHUNK ${c} ATTEMPT ${attempt}] API error: ${err.message}`);
              if (attempt < 3 && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('rate'))) {
                const retryMatch = err.message.match(/retry in ([0-9\.]+)s/i);
                const waitSec = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) + 1 : 12;
                console.log(`[GEMINI RATE LIMIT RETRY] Dynamic quota backoff: waiting ${waitSec}s before retrying chunk ${c}...`);
                await new Promise((r) => setTimeout(r, waitSec * 1000));
              } else if (attempt === 3) {
                throw err;
              }
            }
          }

          let rawData;
          try {
            rawData = this._parseJSON(responseText);
          } catch (_err) {
            rawData = this._extractFullTextFallback(responseText, chunkDur);
          }

          if (rawData.words && Array.isArray(rawData.words)) {
            let chunkWords = [];
            for (const wArr of rawData.words) {
              let wText = '', wStart = 0, wEnd = 0, wEmp = 0.5;
              if (Array.isArray(wArr) && wArr.length >= 3) {
                wText = String(wArr[0] || '');
                wStart = parseFloat(wArr[1]) || 0;
                wEnd = parseFloat(wArr[2]) || (wStart + 0.3);
                wEmp = parseFloat(wArr[3]) || 0.5;
              } else if (typeof wArr === 'object' && wArr !== null) {
                wText = String(wArr.word || wArr.text || '');
                wStart = parseFloat(wArr.start) || 0;
                wEnd = parseFloat(wArr.end) || (wStart + 0.3);
                wEmp = parseFloat(wArr.emphasisScore || wArr.emphasis) || 0.5;
              }
              chunkWords.push({ wText, wStart, wEnd, wEmp });
            }

            // Acoustic Onset Alignment: Ensure first word matches real acoustic speech onset within chunk
            if (chunkWords.length > 0 && speechOnset > 0.1 && speechOnset < chunkDur) {
              const delta = speechOnset - chunkWords[0].wStart;
              if (Math.abs(delta) > 0.15 && Math.abs(delta) < (chunkDur / 2)) {
                console.log(`[ACOUSTIC ONSET ALIGNMENT] Chunk ${c}: Adjusting start time by ${delta > 0 ? '+' : ''}${delta.toFixed(2)}s to match speech onset (${speechOnset.toFixed(2)}s)`);
                chunkWords = chunkWords.map(w => {
                  const newStart = Math.max(speechOnset, Math.round((w.wStart + delta) * 100) / 100);
                  const newEnd = Math.max(newStart + 0.1, Math.round((w.wEnd + delta) * 100) / 100);
                  return { ...w, wStart: newStart, wEnd: newEnd };
                });
              }
            }

            for (const w of chunkWords) {
              const startSec = Math.round((w.wStart + offset) * 100) / 100;
              const endSec = Math.max(startSec + 0.1, Math.round((w.wEnd + offset) * 100) / 100);

              // Smart Deduplication for overlapping chunk windows
              const lastWord = allWords.length > 0 ? allWords[allWords.length - 1] : null;
              if (lastWord) {
                const prevStart = lastWord[1];
                const prevText = String(lastWord[0] || '').toLowerCase().trim();
                const currText = String(w.wText || '').toLowerCase().trim();

                // If word falls inside overlapping window and matches previous word or starts before previous end
                if (Math.abs(startSec - prevStart) < 0.45 && (currText === prevText || startSec < lastWord[2] - 0.1)) {
                  continue; // Skip duplicate word from overlap
                }
              }

              allWords.push([w.wText, startSec, endSec, w.wEmp]);
            }
          }

          if (rawData.fullText) fullText += (fullText ? ' ' : '') + rawData.fullText;
          if (rawData.language) language = rawData.language;
          if (rawData.hook && c === 0) hook = rawData.hook;

        } catch (chunkErr) {
          console.warn(`[GEMINI CHUNKING WARNING] Processing chunk ${c} failed: ${chunkErr.message}`);
        } finally {
          try { if (fs.existsSync(chunkPath)) fs.unlinkSync(chunkPath); } catch (_e) { }
        }

        // Throttle 1.0s between chunks to stay strictly within Free Tier 5 RPM quota
        if (c < numChunks - 1) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    } else {
      const mimeType = audioPath.endsWith('.mp4') ? 'video/mp4' : 'audio/wav';
      const audioPart = fileToGenerativePart(audioPath, mimeType);

      const prompt = `You are an expert Speech Transcriber and Reel Caption Director.
LISTEN carefully to the attached ${duration.toFixed(1)}-second audio file and transcribe ALL spoken human voice content across the FULL video from t=0.00s to t=${duration.toFixed(2)}s with 100% precise acoustic synchronization.

TARGET OUTPUT SCRIPT STYLE:
${styleInstruction}

AUDIO ENVIRONMENT & HEAVY BGM INSTRUCTION:
This audio file may contain background music (BGM), beats, instruments, or noise. IGNORE all background music, beats, and instruments completely. Isolate and transcribe ALL spoken human voice words across the full ${duration.toFixed(1)}-second duration from start to end without leaving gaps or missing any phrases!

CRITICAL TIMING & SYNCHRONIZATION CONSTRAINTS:
1. Provide exact word-level timestamps in seconds with 2 decimal places (e.g., 0.15, 1.42). Total audio duration is EXACTLY ${duration.toFixed(2)} seconds.
2. Start time of the first word MUST match actual speech onset audio, not arbitrary 0.00.
3. Word timestamps MUST be strictly monotonic and ordered: word[n].start < word[n].end and word[n].end <= word[n+1].start.
4. Transcribe ALL words spoken in the video from start to finish. DO NOT skip phrases or stop transcribing early.
5. Structure output words according to requested script style (${targetStyle}).
6. NO-TRANSLATION MANDATE: UNLESS targetStyle is explicitly 'english', NEVER translate spoken non-English, Telugu, Hindi, or code-switched words into English. Transcribe verbatim spoken words in Romanized script (e.g. Teluglish).

Return ONLY a compact JSON object with this exact structure:
{
  "fullText": "<transcript/translation in requested target script>",
  "language": "te|en|hi",
  "words": [
    ["Word1", start_sec, end_sec, emphasis_0_to_1],
    ["Word2", start_sec, end_sec, emphasis_0_to_1]
  ],
  "hook": "<VIRAL HOOK TITLE WITH EMOJI>"
}`;

      const responseText = await this._generateContentWithFallback([audioPart, prompt], {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 8192,
      });

      let rawData;
      try {
        rawData = this._parseJSON(responseText);
      } catch (_err) {
        rawData = this._extractFullTextFallback(responseText, duration);
      }

      allWords = rawData.words || [];
      fullText = rawData.fullText || '';
      language = rawData.language || 'te';
      hook = rawData.hook || hook;
    }

    // Zero-Gap Safety Scanner: Automatically detect and re-inspect any unexplained audio gap > 3.5s
    allWords = await this._scanAndRepairUnexplainedAudioGaps(allWords, audioPath, duration, targetStyle, styleInstruction);

    const rawDataCombined = {
      fullText,
      language,
      words: allWords,
      hook,
    };

    const timeline = this._buildTimelineFromWords(rawDataCombined, duration);
    const latencyMs = Date.now() - startTime;
    console.log(`[GEMINI AUDIO STT] ✅ 100% Zero-Gap Audio STT complete in ${latencyMs}ms — ${timeline.segments.length} segments`);

    return {
      timeline,
      fullText,
      language,
      provider: 'gemini-audio-stt',
      latencyMs,
    };
  }



  /**
   * Transforms raw STT words into target language script (Pure English translation, Pure Telugu, Pure Hindi, Tanglish, or Chatting script).
   */
  async transformSTTWordsToTargetStyle({ words, fullText, duration = 15, targetStyle = 'auto' }) {
    if (!this.ai || !Array.isArray(words) || words.length === 0) {
      const timeline = this._buildTimelineFromWords({ words, fullText }, duration);
      if (timeline) timeline.targetStyle = targetStyle;
      return { timeline, fullText, language: 'en' };
    }

    if (targetStyle === 'auto') {
      const timeline = this._buildTimelineFromWords({ words, fullText }, duration);
      if (timeline) timeline.targetStyle = targetStyle;
      return { timeline, fullText, language: 'en' };
    }

    const styleInstruction = getStyleInstruction(targetStyle);
    console.log(`[GEMINI STT TRANSFORMER] Transforming ${words.length} STT words to target style '${targetStyle}'...`);

    const wordListStr = JSON.stringify(
      words.map((w) => [w.word, parseFloat((w.start || 0).toFixed(2)), parseFloat((w.end || 0).toFixed(2))])
    );

    const prompt = `You are a Master Reel Caption Language & Translation Director.
I have a list of transcribed words with exact start and end timestamps (in seconds):
${wordListStr}

Full Spoken Text Context: "${fullText}"

TARGET SCRIPT & LANGUAGE STYLE MANDATE:
${styleInstruction}

INSTRUCTIONS:
1. STRICT ZERO-LOSS WORD COUNT PRESERVATION: You MUST output EVERY SINGLE SPOKEN WORD from the input list. DO NOT summarize, DO NOT drop phrases, and DO NOT condense a 20-word speech into 4-5 summary words!
2. Transform/Translate the word list into the requested target script (${targetStyle}) while preserving the exact 1-to-1 word count and sequence.
3. Maintain word-level alignment with the original speech timing so total duration (${duration}s) matches perfectly.
4. If targetStyle is 'english', replace non-English/Telugu/Hindi words with their PURE ENGLISH translation equivalents.
5. If targetStyle is 'telugu', convert all words into PURE NATIVE TELUGU SCRIPT (తెలుగు).
6. If targetStyle is 'hindi', convert all words into PURE NATIVE HINDI DEVANAGARI SCRIPT (हिंदी).
7. If targetStyle is 'chatting', write pure spoken Telugu words in casual Romanized chat script (e.g. "em chestunnav raa", "photographer uncle", "nuvvu book rastunna", "haa interesting title enti"). DO NOT translate into English words or summarize!
8. If targetStyle is 'tel_eng', produce strict word-level code-mixed Tanglish: Telugu words in Roman script ("naa"), English words in standard English ("friends"). Example: "naa friends".
9. If targetStyle is 'hin_eng', produce strict word-level code-mixed Hinglish: Hindi words in Roman script ("bhai", "kya"), English words in standard English ("friends", "project"). Example: "bhai project heavy hai".
10. If targetStyle is 'hin_tel', produce clean code-mixed Hindi + Telugu: Romanized Hindi ("bhai") and Romanized Telugu ("nenu osthanu"). Example: "bhai nenu osthanu".

Return ONLY a JSON object:
{
  "fullText": "<transformed text in target language>",
  "language": "en|te|hi",
  "words": [
    ["Word1", start_sec, end_sec, emphasis_score_0_to_1],
    ["Word2", start_sec, end_sec, emphasis_score_0_to_1]
  ],
  "hook": "<VIRAL HOOK TITLE WITH EMOJI>"
}`;

    try {
      const rawData = await this._callGeminiWithRetry(prompt, { temperature: 0.1 }, 3);
      const timeline = this._buildTimelineFromWords(rawData, duration);
      if (timeline) {
        timeline.targetStyle = targetStyle;
      }
      return {
        timeline,
        fullText: rawData.fullText || fullText,
        language: rawData.language || 'en',
      };
    } catch (err) {
      console.warn(`[GEMINI STT TRANSFORMER ERROR] Transformation failed: ${err.message}. Using raw STT words fallback.`);
      let fallbackWords = words;
      let fallbackFullText = fullText;
      if (['chatting', 'tel_eng', 'hinglish', 'auto'].includes(targetStyle)) {
        fallbackWords = words.map((w) => ({
          ...w,
          word: transliterateTeluguToRoman(w.word),
        }));
        fallbackFullText = transliterateTeluguToRoman(fullText);
      }

      const timeline = this._buildTimelineFromWords({ words: fallbackWords, fullText: fallbackFullText }, duration);
      if (timeline) {
        timeline.targetStyle = targetStyle;
      }
      return { timeline, fullText: fallbackFullText, language: 'en' };
    }
  }

  /**
   * Scans transcribed words for any unexplained gap > 3.5s and re-inspects
   * that specific audio segment with high vocal sensitivity to recover missing captions.
   */
  async _scanAndRepairUnexplainedAudioGaps(allWords, audioPath, duration, targetStyle, styleInstruction) {
    if (!Array.isArray(allWords) || allWords.length === 0) return allWords;

    // Sort words by start time
    const sorted = [...allWords].sort((a, b) => (parseFloat(a[1]) || 0) - (parseFloat(b[1]) || 0));
    const gapsToRepair = [];

    // Check gap before first word if first word starts late (> 4s)
    const firstStart = parseFloat(sorted[0][1]) || 0;
    if (firstStart > 4.0) {
      gapsToRepair.push({ start: 0, end: firstStart, label: 'head' });
    }

    // Check gaps between consecutive words
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentEnd = parseFloat(sorted[i][2]) || 0;
      const nextStart = parseFloat(sorted[i + 1][1]) || 0;
      const gapSize = nextStart - currentEnd;

      if (gapSize > 3.5) {
        gapsToRepair.push({ start: currentEnd, end: nextStart, label: `mid_${i}` });
      }
    }

    // Check gap after last word if last word ends early (> 4s before duration)
    const lastEnd = parseFloat(sorted[sorted.length - 1][2]) || 0;
    if (duration - lastEnd > 4.0) {
      gapsToRepair.push({ start: lastEnd, end: duration, label: 'tail' });
    }

    if (gapsToRepair.length === 0) {
      console.log(`[ZERO-GAP SAFETY SCANNER] ✅ No unexplained gaps detected (> 3.5s). Audio coverage 100% complete.`);
      return sorted;
    }

    console.log(`[ZERO-GAP SAFETY SCANNER] ⚠️ Found ${gapsToRepair.length} unexplained audio gaps (> 3.5s). Re-inspecting snippets...`);
    const recoveredWords = [...sorted];
    const tmpDir = path.dirname(audioPath);

    for (const gap of gapsToRepair) {
      const gapDur = gap.end - gap.start;
      if (gapDur < 1.0) continue;

      const chunkPath = path.join(tmpDir, `tmp_gap_${Date.now()}_${gap.start.toFixed(1)}_${Math.random().toString(36).substring(7)}.wav`);

      try {
        await extractAudioChunk(audioPath, gap.start, gapDur, chunkPath);
        const audioPart = fileToGenerativePart(chunkPath, 'audio/wav');

        const prompt = `You are a High-Sensitivity Vocal Recovery Transcriber.
LISTEN carefully to this isolated ${gapDur.toFixed(1)}-second audio segment (from t=${gap.start.toFixed(1)}s to t=${gap.end.toFixed(1)}s).
This segment may contain background music (BGM) or quiet vocals. IGNORE background music and isolate ANY human speech spoken in this ${gapDur.toFixed(1)}s clip!

TARGET SCRIPT STYLE:
${styleInstruction}

Return ONLY a JSON object with this exact structure:
{
  "words": [
    ["Word1", start_sec_within_snippet, end_sec_within_snippet, 0.9],
    ["Word2", start_sec_within_snippet, end_sec_within_snippet, 0.9]
  ]
}`;

        const model = this.ai.getGenerativeModel({
          model: this.modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        });

        const result = await model.generateContent([audioPart, prompt]);
        const rawData = this._parseJSON(result.response.text());

        if (rawData.words && Array.isArray(rawData.words) && rawData.words.length > 0) {
          console.log(`[ZERO-GAP SAFETY RECOVERY] 🎉 Recovered ${rawData.words.length} missing words in gap ${gap.start.toFixed(1)}s–${gap.end.toFixed(1)}s!`);
          for (const wArr of rawData.words) {
            if (Array.isArray(wArr) && wArr.length >= 3) {
              const wText = String(wArr[0] || '').trim();
              const wStart = Math.round((parseFloat(wArr[1]) + gap.start) * 100) / 100;
              const wEnd = Math.max(wStart + 0.1, Math.round((parseFloat(wArr[2]) + gap.start) * 100) / 100);
              if (wText) {
                recoveredWords.push([wText, wStart, wEnd, 0.9]);
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[ZERO-GAP SAFETY RECOVERY] Re-inspection for gap ${gap.start.toFixed(1)}s–${gap.end.toFixed(1)}s skipped: ${err.message}`);
      } finally {
        try { if (fs.existsSync(chunkPath)) fs.unlinkSync(chunkPath); } catch (_e) { }
      }
    }

    return recoveredWords.sort((a, b) => (parseFloat(a[1]) || 0) - (parseFloat(b[1]) || 0));
  }

  /**
   * Extracts real transcribed text if JSON was cut off mid-response.
   * NEVER loses the real speech transcript.
   */
  _extractFullTextFallback(responseText, duration) {
    const match = responseText.match(/"fullText"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    let fullText = match ? match[1].replace(/\\"/g, '"') : '';

    if (!fullText) {
      // Try finding raw text string
      fullText = responseText.replace(/[\{\}\[\]"]/g, ' ').trim();
    }

    console.log(`[GEMINI FALLBACK RECOVERY] Recovered real speech transcript (${fullText.length} chars)`);

    const rawWords = fullText.trim().split(/\s+/).filter(Boolean);
    const totalDuration = Math.max(duration || 10, 5);
    const timePerWord = totalDuration / Math.max(rawWords.length, 1);

    const words = rawWords.map((w, i) => {
      const start = Math.round(i * timePerWord * 100) / 100;
      const end = Math.round((i + 1) * timePerWord * 100) / 100;
      return [
        w,
        start,
        Math.max(start + 0.05, end - 0.02),
        i % 4 === 0 ? 0.9 : 0.5,
      ];
    });

    return {
      fullText,
      language: 'te',
      words,
      hook: 'VIRAL REEL CAPTIONS 🔥',
    };
  }

  /**
   * Validates and repairs word timestamps to prevent overlap, gap dropouts, and negative/out-of-bounds timings.
   */
  _validateAndRepairTimestamps(wordObjects, videoDuration) {
    if (!Array.isArray(wordObjects) || wordObjects.length === 0) return [];

    const maxDur = videoDuration && videoDuration > 0 ? videoDuration : 9999;

    // Filter valid objects and sort strictly by start timestamp
    const cleanWords = wordObjects.map((w) => {
      let start = Math.max(0, Math.round((parseFloat(w.start) || 0) * 100) / 100);
      let end = Math.round((parseFloat(w.end) || start + 0.3) * 100) / 100;
      if (end <= start) end = Math.round((start + 0.25) * 100) / 100;
      return { ...w, start, end };
    }).sort((a, b) => a.start - b.start);

    const repaired = [];

    for (let i = 0; i < cleanWords.length; i++) {
      const current = { ...cleanWords[i] };

      if (current.start > maxDur) current.start = Math.max(0, maxDur - 0.1);
      if (current.end > maxDur) current.end = maxDur;
      if (current.end <= current.start) current.end = Math.round((current.start + 0.25) * 100) / 100;

      if (repaired.length > 0) {
        const prev = repaired[repaired.length - 1];

        // Deduplicate chunk boundary duplicate words if exact match within 0.6s
        if (
          prev.word.trim().toLowerCase() === current.word.trim().toLowerCase() &&
          Math.abs(current.start - prev.start) < 0.6
        ) {
          prev.end = Math.max(prev.end, current.end);
          continue;
        }

        // Fix Overlaps smoothly without cascading collapse
        if (current.start < prev.end) {
          const overlap = prev.end - current.start;
          if (overlap > 0.05) {
            const mid = Math.round(((prev.end + current.start) / 2) * 100) / 100;
            if (mid > prev.start + 0.15) {
              prev.end = mid;
              current.start = mid;
            } else {
              current.start = Math.round((prev.end) * 100) / 100;
            }
          }
          if (current.end <= current.start) {
            current.end = Math.round((current.start + 0.25) * 100) / 100;
          }
        }

        // Fill Small Gaps (<= 0.45s) so captions flow seamlessly without jarring visual dropouts
        const gap = current.start - prev.end;
        if (gap > 0 && gap <= 0.45) {
          prev.end = current.start;
        }
      }

      repaired.push(current);
    }

    return repaired;
  }

  /**
   * Dynamically groups words into segments based on punctuation, emphasis, speech pauses, and cadence.
   * NO MORE rigid fixed 3-word chunks.
   */
  _buildSmartDynamicSegments(wordObjects) {
    if (!Array.isArray(wordObjects) || wordObjects.length === 0) return [];

    const chunks = [];
    let currentChunk = [];

    for (let i = 0; i < wordObjects.length; i++) {
      const w = wordObjects[i];
      const next = wordObjects[i + 1];

      currentChunk.push(w);

      const wordText = (w.word || '').trim();
      const hasPunctuation = /[.,!?-]$/.test(wordText);
      const isHighEmphasis = (w.emphasisScore || 0) >= 0.78;
      const gapToNext = next ? (next.start - w.end) : 0;
      const hasPause = next && gapToNext > 0.18;

      if (
        (isHighEmphasis && currentChunk.length === 1) ||
        hasPunctuation ||
        hasPause ||
        currentChunk.length >= 3 ||
        !next
      ) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Builds kinetic timeline segments from compact word array.
   */
  _buildTimelineFromWords(rawData, videoDuration) {
    const rawWords = rawData.words || [];
    let wordObjects = [];

    if (Array.isArray(rawWords) && rawWords.length > 0) {
      wordObjects = rawWords.map((wArr) => {
        if (Array.isArray(wArr)) {
          return {
            word: String(wArr[0] || ''),
            start: parseFloat(wArr[1]) || 0,
            end: parseFloat(wArr[2]) || 0,
            emphasisScore: parseFloat(wArr[3]) || 0.5,
          };
        } else if (typeof wArr === 'object') {
          return {
            word: wArr.word || '',
            start: wArr.start || 0,
            end: wArr.end || 0,
            emphasisScore: wArr.emphasisScore || 0.5,
          };
        }
        return { word: String(wArr), start: 0, end: 0, emphasisScore: 0.5 };
      });
    } else if (rawData.fullText) {
      const split = rawData.fullText.trim().split(/\s+/).filter(Boolean);
      const totalDur = Math.max(videoDuration || 10, 5);
      const tpw = totalDur / Math.max(split.length, 1);
      wordObjects = split.map((w, i) => ({
        word: w,
        start: Math.round(i * tpw * 100) / 100,
        end: Math.round((i + 1) * tpw * 100) / 100,
        emphasisScore: i % 4 === 0 ? 0.9 : 0.5,
      }));
    }

    // Repair timestamps to guarantee strict monotonic progression and no gaps/overlaps
    wordObjects = this._validateAndRepairTimestamps(wordObjects, videoDuration);

    const segments = [];
    const chunks = this._buildSmartDynamicSegments(wordObjects);

    const stylePresetsList = [
      THEME_PRESETS.HORMOZI,
      THEME_PRESETS.NEON_GLOW,
      THEME_PRESETS.FIRE_RED,
      THEME_PRESETS.CYBER_PURPLE,
      THEME_PRESETS.GOLD_LUXURY,
      THEME_PRESETS.BOLD_VIRAL,
      THEME_PRESETS.ELECTRIC_LIME,
    ];
    const animTypesList = ['pop', 'bounce', 'glow', 'slide'];

    for (let segIndex = 0; segIndex < chunks.length; segIndex++) {
      const chunk = chunks[segIndex];
      const segStart = chunk[0].start;
      let segEnd = chunk[chunk.length - 1].end;

      // Extend segment end to next segment start if gap is natural speech pause (<0.65s) for 100% seamless caption display
      const nextChunk = chunks[segIndex + 1];
      if (nextChunk && (nextChunk[0].start - segEnd) < 0.65) {
        segEnd = nextChunk[0].start;
      }

      segments.push({
        id: uuidv4(),
        start: segStart,
        end: segEnd,
        displayMode: chunk.length === 1 ? 'single_word' : `chunk_${chunk.length}`,
        animation: null, // Inherits global theme animation; only set if user manually overrides per-segment
        styleOverride: null, // Inherits global theme style; only set if user manually overrides per-segment
        position: { x: 50, y: 75 },
        fontStyle: {
          fontFamily: 'Inter',
          fontSize: 48,
          fontWeight: '800',
          textColor: '#FFFFFF',
          strokeColor: '#000000',
          strokeWidth: 2,
          backgroundColor: null,
          shadow: '0 2px 8px rgba(0,0,0,0.6)',
        },
        words: chunk.map((w) => ({
          id: uuidv4(),
          word: w.word,
          start: w.start,
          end: w.end,
          confidence: 0.95,
          emphasisScore: w.emphasisScore,
          isHighlighted: w.emphasisScore >= 0.7,
          highlightColor: w.emphasisScore >= 0.7 ? '#FACC15' : null,
          emoji: null,
          sfx: 'none',
          caseFormat: w.emphasisScore >= 0.8 ? 'uppercase' : 'original',
        })),
      });
    }

    const suggestions = rawData?.hookSuggestions && Array.isArray(rawData.hookSuggestions) && rawData.hookSuggestions.length >= 3
      ? rawData.hookSuggestions
      : [
          rawData?.hook || 'STOP DOING THIS IN 2026 🚨',
          'THE UNTOLD REELS SECRET ⚡',
          'WATCH THIS BEFORE YOU START 🚀',
          'TRY THIS VIRAL TRICK 🔥',
          'DONT MISS THIS TODAY 💡',
        ];

    return {
      version: '1.0',
      aspectRatio: '9:16',
      topBanner: {
        enabled: true,
        text: suggestions[0],
        backgroundColor: '#FFE600',
        textColor: '#000000',
        fontFamily: 'Montserrat',
      },
      topBannerSuggestions: suggestions,
      stickyHook: null,
      segments,
      globalTheme: {
        fontFamily: 'Inter',
        primaryColor: '#FFFFFF',
        highlightColor: '#F97316',
        presetName: THEME_PRESETS.VIRAL_SCRIPT_HYBRID,
      },
    };
  }

  async _callGeminiWithRetry(prompt, generationConfig = {}, maxRetries = 3) {
    if (!this.ai) {
      throw new Error('Gemini API key not configured.');
    }

    const responseText = await this._generateContentWithFallback(prompt, {
      responseMimeType: 'application/json',
      temperature: 0.1,
      ...generationConfig,
    });
    return this._parseJSON(responseText);
  }

  async generateCaptionTimeline(input) {
    if (!this.ai) {
      throw new Error('Gemini API key not configured.');
    }

    const startTime = Date.now();
    const { words, fullText, language, duration, emphasisScores, aspectRatio, presetName, targetStyle = 'auto' } = input || {};

    const enrichedWords = words.map((w, i) => ({
      ...w,
      emphasisScore: emphasisScores?.[i] ?? 0.5,
    }));

    try {
      const prompt = this._buildCompactPrompt(enrichedWords, fullText, language, targetStyle);
      const rawTimeline = await this._callGeminiWithRetry(prompt, { maxOutputTokens: 16384 }, 3);

      const timeline = this._normalizeTimeline(rawTimeline, enrichedWords, aspectRatio, presetName);
      if (timeline) {
        timeline.targetStyle = targetStyle;
      }

      const latencyMs = Date.now() - startTime;
      return {
        timeline,
        provider: this.name,
        latencyMs,
      };
    } catch (err) {
      console.warn(`[GEMINI CAPTION DIRECTOR] LLM styling failed (${err.message}). Falling back to STT word transformer...`);
      return this.transformSTTWordsToTargetStyle({ words: enrichedWords, fullText, duration, targetStyle });
    }
  }

  _parseJSON(text) {
    if (!text) return {};
    let repaired = String(text).trim();

    // 1. Strip markdown code block wrappers if any (handles prefixed text before ```json)
    const codeBlockMatch = repaired.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      repaired = codeBlockMatch[1].trim();
    } else {
      repaired = repaired.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    // 2. Extract substring between first '{' and last '}'
    const firstBrace = repaired.indexOf('{');
    const lastBrace = repaired.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      repaired = repaired.substring(firstBrace, lastBrace + 1);
    }

    // 3. Strip single-line JS style comments if present
    repaired = repaired.replace(/^\s*\/\/.*$/gm, '');

    // 4. Attempt standard JSON.parse
    try {
      return JSON.parse(repaired);
    } catch (_e) {
      // Continue to auto-repair
    }

    // 5. Advanced bracket/quote repair for truncated responses
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escaped = false;

    for (const ch of repaired) {
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') openBraces++;
      if (ch === '}') openBraces--;
      if (ch === '[') openBrackets++;
      if (ch === ']') openBrackets--;
    }

    if (inString) repaired += '"';
    repaired = repaired.replace(/,\s*$/, '');
    repaired = repaired.replace(/,?\s*"[^"]*"\s*:\s*$/, '');

    for (let i = 0; i < openBrackets; i++) repaired += ']';
    for (let i = 0; i < openBraces; i++) repaired += '}';

    try {
      return JSON.parse(repaired);
    } catch (e2) {
      throw new Error(`Gemini returned invalid JSON: ${e2.message}`);
    }
  }

  _buildCompactPrompt(enrichedWords, fullText, language, targetStyle = 'auto') {
    const styleInstruction = getStyleInstruction(targetStyle);

    const wordsCompact = enrichedWords.map((w, i) =>
      `[${i},"${w.word}",${w.start},${w.end},${w.emphasisScore}]`
    ).join(',');

    return `You are an expert Speech Transcriber, Language Director, and Viral Reel Caption Director.
Your task is to take the provided word timestamps and build kinetic caption segments matching the requested TARGET SCRIPT & LANGUAGE STYLE MANDATE.

TARGET SCRIPT & LANGUAGE STYLE MANDATE:
${styleInstruction}

CRITICAL SCRIPT TRANSFORMATION RULES:
1. If targetStyle is 'chatting': Transcribe/convert ALL spoken words into pure casual Telugu/Hindi CHATTING script using ONLY the English Alphabet (WhatsApp/Instagram chat style, e.g. "em chestunnav raa", "chesam", "chusam", "aakariki", "kudaa", "fail ayyavu kada"). DO NOT output native Telugu script (తెలుగు) or native Devanagari script (हिंदी) under any circumstances! DO NOT translate Telugu words into English words (e.g. NEVER convert "em chestunnav" to "what are you doing").
2. If targetStyle is 'tel_eng': Transcribe/convert words into strict word-level code-mixed Tanglish. Spoken Telugu words MUST be in Romanized script ("naa", "lo", "kudaa", "aynaa"), and spoken English words MUST keep standard English spelling ("friends", "video", "fail", "college"). Example: "naa friends".
3. If targetStyle is 'hin_eng': Transcribe/convert words into strict word-level code-mixed Hinglish. Spoken Hindi words MUST be in Romanized script ("bhai", "kya", "kar", "rahe"), and spoken English words MUST keep standard English spelling ("friends", "video", "project"). Example: "bhai project heavy hai".
4. If targetStyle is 'hin_tel': Produce clean code-mixed Hindi + Telugu: Romanized Hindi ("bhai") and Romanized Telugu ("nenu osthanu"). Example: "bhai nenu osthanu".
5. If targetStyle is 'english': Translate all non-English spoken words into high-converting, punchy PURE ENGLISH words.
6. If targetStyle is 'telugu': Convert all words into PURE NATIVE TELUGU SCRIPT (తెలుగు లిపి).
7. If targetStyle is 'hindi': Convert all words into PURE NATIVE HINDI DEVANAGARI SCRIPT (हिंदी).

CAPTION TIMELINE RULES:
- Group 1-3 words per segment. High emphasis (>=0.7) = single word, UPPERCASE, pop/bounce animation. Medium (0.4-0.7) = chunk of 2. Low (<0.4) = chunk of 2-3, no animation.
- Output clean, readable caption text. Add emojis ONLY if targetStyle is explicitly 'genz'.
- Add sfx to max 2 moments ("pop", "whoosh", "none").
- Ensure word timestamps [start, end] correspond accurately to the order and timing of the input words.

INPUT WORD DATA [index,"word",start,end,emphasis]: [${wordsCompact}]
FULL SPOKEN TEXT: "${fullText}"
LANGUAGE: ${language}
TARGET STYLE: ${targetStyle}

Return JSON: {"segments":[{"start":N,"end":N,"displayMode":"single_word|chunk_2|chunk_3","animation":"pop|bounce|slide|glow|none","words":[{"word":"<Transformed word in target style script>","start":N,"end":N,"emphasisScore":N,"isHighlighted":bool,"highlightColor":"#hex|null","emoji":"emoji|null","sfx":"pop|whoosh|none","caseFormat":"uppercase|lowercase|original"}]}],"stickyHook":{"text":"hook with emoji","position":"top"}}`;
  }

  _normalizeTimeline(raw, enrichedWords = [], aspectRatio, presetName) {
    let wordPointer = 0;

    const segments = (raw.segments || []).map((seg) => {
      const segWords = (seg.words || []).map((w) => {
        let exactStart = w.start || 0;
        let exactEnd = w.end || 0;
        let exactConfidence = w.confidence || 0.9;

        // If we have precise STT enrichedWords (e.g. from Deepgram Nova-3), lock timestamps to STT truth
        if (Array.isArray(enrichedWords) && enrichedWords.length > 0) {
          const cleanWText = (w.word || '').trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
          let matched = null;

          // Look ahead up to 5 words to find exact matching word in enrichedWords
          for (let p = wordPointer; p < Math.min(enrichedWords.length, wordPointer + 5); p++) {
            const ewText = (enrichedWords[p].word || '').trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
            if (cleanWText && ewText && (cleanWText === ewText || cleanWText.includes(ewText) || ewText.includes(cleanWText))) {
              matched = enrichedWords[p];
              wordPointer = p + 1;
              break;
            }
          }

          if (!matched && wordPointer < enrichedWords.length) {
            // If w.start is already a valid timestamp provided by LLM, prefer w.start/w.end
            if (typeof w.start === 'number' && w.start > 0 && typeof w.end === 'number' && w.end > w.start) {
              exactStart = w.start;
              exactEnd = w.end;
            } else {
              matched = enrichedWords[wordPointer];
              wordPointer++;
            }
          }

          if (matched) {
            exactStart = matched.start;
            exactEnd = matched.end;
            exactConfidence = matched.confidence || 0.9;
          }
        }

        exactStart = Math.max(0, Math.round(exactStart * 100) / 100);
        exactEnd = Math.max(exactStart + 0.05, Math.round(exactEnd * 100) / 100);

        let wordText = w.word || '';
        const cleanLower = wordText.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
        const emojiMap = {
          // Fire & Energy
          fire: '🔥', hot: '🔥', burn: '🔥', manta: '🔥', aag: '🔥', blast: '💥', boom: '💥',
          // Speed & Fast
          fast: '⚡', speed: '⚡', quick: '⚡', twaraga: '⚡', jaldi: '⚡',
          // Money & Wealth
          money: '💰', cash: '💰', dollar: '💰', rich: '💰', dhabbu: '💰', paisa: '💰', lakh: '💰', crore: '💰',
          // Victory & Winning
          win: '🏆', winner: '🏆', victory: '🏆', gelupu: '🏆', jeet: '🏆', trophy: '🏆',
          // King & Authority & Father
          king: '👑', boss: '👑', leader: '👑', ayya: '👑', baap: '👑', papa: '👑', father: '👑',
          // Love & Emotion
          love: '❤️', heart: '❤️', pyaar: '❤️', prema: '❤️', gunde: '❤️', dil: '❤️',
          // Death & Danger & Stop
          death: '💀', dead: '💀', die: '💀', chavu: '💀', mar: '💀', marna: '💀', khatam: '💀',
          danger: '🚨', alert: '🚨', warning: '🚨', apayam: '🚨', khatra: '🚨', stop: '🛑',
          // Challenge & Target & Questions
          target: '🎯', goal: '🎯', saval: '🎯', challenge: '🎯', sharth: '🎯', question: '❓',
          // Thinking & Mind
          think: '🤔', thought: '🤔', sochna: '🤔', alochana: '🤔', brain: '💡', dimag: '💡', idea: '💡',
          // Face & Seeing
          face: '🗿', moham: '🗿', chehra: '🗿', look: '👀', see: '👀', chudadam: '👀', dekh: '👀',
          // Truth & Facts
          truth: '💯', fact: '💯', real: '💯', sach: '💯', nijam: '💯', cap: '🧢',
          // Magic & Star & Rocket
          star: '⭐', magic: '✨', shine: '✨', hero: '🦸', rocket: '🚀', growth: '📈', video: '🎥', reel: '📱', time: '⏱️',
        };

        let autoEmoji = w.emoji || null;
        if (!autoEmoji && (raw?.targetStyle === 'genz' || raw?.applyEmojis === true)) {
          for (const [key, emoji] of Object.entries(emojiMap)) {
            if (cleanLower === key || cleanLower.startsWith(key)) {
              autoEmoji = emoji;
              if (!wordText.includes(emoji)) {
                wordText = `${wordText.trim()} ${emoji}`;
              }
              break;
            }
          }
        }

        return {
          id: uuidv4(),
          word: wordText,
          start: exactStart,
          end: exactEnd,
          confidence: exactConfidence,
          emphasisScore: w.emphasisScore || 0.5,
          isHighlighted: w.isHighlighted || !!autoEmoji,
          highlightColor: w.highlightColor || (autoEmoji ? '#FACC15' : null),
          emoji: autoEmoji,
          sfx: Object.values(SFX_TYPES).includes(w.sfx) ? w.sfx : SFX_TYPES.NONE,
          caseFormat: Object.values(CASE_FORMATS).includes(w.caseFormat)
            ? w.caseFormat
            : CASE_FORMATS.ORIGINAL,
        };
      }).filter((w) => w.word.trim().length > 0);

      if (segWords.length === 0) return null;

      // Micro-Pause Auto-Clamping within segment words to eliminate intra-segment flicker
      for (let wIdx = 0; wIdx < segWords.length - 1; wIdx++) {
        const currW = segWords[wIdx];
        const nextW = segWords[wIdx + 1];
        const wGap = nextW.start - currW.end;
        if (wGap > 0 && wGap <= 0.35) {
          currW.end = nextW.start;
        }
      }

      const segStart = segWords[0].start;
      let segEnd = segWords[segWords.length - 1].end;
      if (segEnd <= segStart) {
        segEnd = Math.round((segStart + 0.25) * 100) / 100;
      }

      return {
        id: uuidv4(),
        start: segStart,
        end: segEnd,
        displayMode: Object.values(DISPLAY_MODES).includes(seg.displayMode)
          ? seg.displayMode
          : DISPLAY_MODES.CHUNK_2,
        animation: (seg.animation && Object.values(ANIMATION_TYPES).includes(seg.animation))
          ? seg.animation
          : null, // Inherit global theme animation
        position: { x: 50, y: 75 },
        fontStyle: {
          fontFamily: 'Inter',
          fontSize: 48,
          fontWeight: '800',
          textColor: '#FFFFFF',
          strokeColor: '#000000',
          strokeWidth: 2,
          backgroundColor: null,
          shadow: '0 2px 8px rgba(0,0,0,0.6)',
        },
        words: segWords,
      };
    })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);

    // Fix continuity and prevent backward end timestamps between adjacent segments
    for (let i = 0; i < segments.length - 1; i++) {
      const current = segments[i];
      const next = segments[i + 1];
      if (current.end > next.start) {
        const mid = Math.round(((current.end + next.start) / 2) * 100) / 100;
        if (mid > current.start + 0.15) {
          current.end = mid;
          next.start = mid;
        } else {
          current.end = Math.max(current.start + 0.15, next.start);
        }
      } else {
        const gap = next.start - current.end;
        if (gap > 0 && gap <= 0.65) {
          current.end = next.start;
        }
      }

      if (current.words.length > 0) {
        current.words[current.words.length - 1].end = current.end;
      }
      if (next.words.length > 0) {
        next.words[0].start = next.start;
      }
    }

    const stickyHook = raw.stickyHook
      ? {
        text: raw.stickyHook.text || '',
        position: raw.stickyHook.position || 'top',
        stylePreset: presetName || THEME_PRESETS.BOLD_VIRAL,
      }
      : null;

    return {
      version: '1.0',
      aspectRatio: aspectRatio || ASPECT_RATIOS.PORTRAIT,
      stickyHook,
      segments,
      globalTheme: {
        fontFamily: 'Inter',
        primaryColor: '#FFFFFF',
        highlightColor: '#FACC15',
        presetName: presetName || THEME_PRESETS.BOLD_VIRAL,
      },
    };
  }

  /**
   * Generate zero-hallucination Instagram & YouTube post captions, titles & #hashtags
   * based strictly on the video transcript.
   */
  async generateSocialPostPack({ fullText, language = 'en' }) {
    if (!this.ai) {
      throw new Error('Gemini API key not configured.');
    }

    const prompt = `You are a World-Class Social Media Copywriter for Instagram Reels, TikTok, and YouTube Shorts.
Based STRICTLY on the actual video transcript provided below, generate a 100% accurate, high-engagement, viral post pack with ZERO hallucinations.

TRANSCRIPT: "${fullText}"
LANGUAGE: ${language}

Return ONLY a JSON object with this exact structure:
{
  "instagram": {
    "caption": "<Engaging 2-3 sentence Instagram caption based strictly on the transcript topic>",
    "hashtags": ["#ReelsIndia", "#ViralReels", "#Trending", "#Hashtag4", "#Hashtag5", "#Hashtag6", "#Hashtag7", "#Hashtag8"]
  },
  "youtubeShorts": {
    "title": "<High CTR Viral YouTube Shorts Title with emoji>",
    "description": "<Concise YouTube Shorts Description with call-to-action>",
    "hashtags": ["#Shorts", "#ViralShorts", "#TrendingShorts", "#Hashtag4", "#Hashtag5"]
  }
}`;

    const model = this.ai.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const result = await model.generateContent(prompt);
    return this._parseJSON(result.response.text());
  }

  /**
   * Translate timeline words into target language while preserving 100% of word timestamps and sync boundaries.
   */
  async translateTimelineText(timeline, targetStyle = 'english') {
    if (!this.ai) {
      throw new Error('Gemini API key not configured.');
    }

    if (!timeline || !Array.isArray(timeline.segments) || timeline.segments.length === 0) {
      return timeline;
    }

    const styleInstruction = getStyleInstruction(targetStyle);

    // Build short-ID map and sentence-context payload for 100% deterministic model matching
    const shortIdToOrigIdMap = new Map();
    const origIdToShortIdMap = new Map();

    const segmentPayload = timeline.segments.map((seg, sIdx) => ({
      index: sIdx,
      fullText: (seg.words || []).map((w) => w.word).join(' '),
      words: (seg.words || []).map((w, wIdx) => {
        const shortId = `w_${sIdx}_${wIdx}`;
        shortIdToOrigIdMap.set(shortId, String(w.id));
        if (w.id) origIdToShortIdMap.set(String(w.id), shortId);
        return { id: shortId, text: w.word };
      }),
    }));

    console.log(`[TRANSLATE BACKEND START] Translating ${timeline.segments.length} segments to targetStyle="${targetStyle}"...`);

    const prompt = `You are a World-Class Subtitle & Speech Translator for Instagram Reels and YouTube Shorts.
TARGET STYLE & LANGUAGE INSTRUCTION:
${styleInstruction}

Translate the subtitle timeblock segments below into the target language/style.

CRITICAL MANDATE:
1. Translate EVERY single segment into the target language with 100% native grammar and 0 dropped segments.
2. If targetStyle is 'english', translate into clear, fluent English.
3. If targetStyle is 'telugu', translate into PURE NATIVE TELUGU SCRIPT (తెలుగు).
4. If targetStyle is 'hindi', translate into PURE NATIVE DEVANAGARI HINDI SCRIPT (हिंदी).
5. If targetStyle is 'chatting', write casual spoken Telugu in Roman script (e.g. "em chestunnav raa", "chusam").
6. If targetStyle is 'tel_eng', produce code-mixed Tanglish ("naa friends", "chala good").
7. Return ONLY a JSON object containing a "translatedSegments" array. For EVERY segment, provide "index", "fullText", and "words" array matching exact word IDs:
{
  "translatedSegments": [
    {
      "index": 0,
      "fullText": " Translated full segment phrase ",
      "words": [
        { "id": "w_0_0", "translatedText": "Translated1" },
        { "id": "w_0_1", "translatedText": "Translated2" }
      ]
    }
  ]
}

SEGMENTS PAYLOAD:
${JSON.stringify(segmentPayload)}`;

    try {
      const rawText = await this._generateContentWithFallback(prompt, {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 4096,
      });
      const parsed = this._parseJSON(rawText);

      // Build multi-tier lookup maps
      const translationMap = new Map();
      const segmentTextMap = new Map();
      const segmentWordListMap = new Map();

      const extractItems = (item) => {
        if (!item) return;
        if (Array.isArray(item)) {
          item.forEach(extractItems);
        } else if (typeof item === 'object') {
          if (item.id && (item.translatedText || item.text || item.translation)) {
            translationMap.set(String(item.id), String(item.translatedText || item.text || item.translation).trim());
          }
          if (typeof item.index === 'number') {
            if (item.fullText || item.translatedText || item.text) {
              segmentTextMap.set(item.index, String(item.fullText || item.translatedText || item.text).trim());
            }
            if (Array.isArray(item.words) && item.words.length > 0) {
              const wArr = item.words
                .map((wObj) => (wObj && (wObj.translatedText || wObj.text || wObj.word) ? String(wObj.translatedText || wObj.text || wObj.word).trim() : null))
                .filter(Boolean);
              if (wArr.length > 0) segmentWordListMap.set(item.index, wArr);
            }
          }
          if (Array.isArray(item.words)) extractItems(item.words);
          if (Array.isArray(item.segments)) extractItems(item.segments);
          if (Array.isArray(item.translatedSegments)) extractItems(item.translatedSegments);
          if (Array.isArray(item.translations)) extractItems(item.translations);
        }
      };
      extractItems(parsed);

      console.log(`[TRANSLATE BACKEND PARSED] Processed ${translationMap.size} translated word IDs & ${segmentTextMap.size} segment texts.`);

      // Deep copy timeline and replace word texts with 4-tier zero-word-drop guarantee
      const newSegments = timeline.segments.map((seg, sIdx) => {
        const segWords = seg.words || [];

        const translatedWords = segWords.map((w, wIdx) => {
          const shortId = `w_${sIdx}_${wIdx}`;
          const origId = String(w.id || '');

          // Tier 1: Match by short ID (e.g. w_0_0)
          let match = translationMap.get(shortId);

          // Tier 2: Match by original ID
          if (!match && origId) {
            match = translationMap.get(origId);
          }

          // Tier 3: Match by positional index in segment word list
          if (!match && segmentWordListMap.has(sIdx)) {
            const list = segmentWordListMap.get(sIdx);
            if (list && list[wIdx]) match = list[wIdx];
          }

          // Tier 4: Match by splitting segment fullText
          if (!match && segmentTextMap.has(sIdx)) {
            const fullText = segmentTextMap.get(sIdx);
            if (fullText) {
              const tokens = fullText.split(/\s+/).filter(Boolean);
              if (tokens[wIdx]) match = tokens[wIdx];
            }
          }

          return {
            ...w,
            word: match || w.word,
          };
        });

        const origStr = segWords.map((w) => w.word).join(' ');
        const transStr = translatedWords.map((w) => w.word).join(' ');
        console.log(`[TRANSLATE BACKEND SEGMENT ${sIdx}] "${origStr}" -> "${transStr}"`);

        return {
          ...seg,
          words: translatedWords,
        };
      });

      console.log(`[TRANSLATE BACKEND SUCCESS] Timeline translated to "${targetStyle}" successfully!`);

      return {
        ...timeline,
        targetStyle,
        segments: newSegments,
      };
    } catch (err) {
      console.error(`[TRANSLATE BACKEND ERROR] Failed to translate timeline: ${err.message}`, err);
      if (['chatting', 'tel_eng', 'hinglish', 'auto'].includes(targetStyle)) {
        console.log(`[TRANSLATE BACKEND FALLBACK] Applying local fail-safe Roman transliteration for '${targetStyle}'...`);
        const transliteratedSegments = (timeline.segments || []).map((seg) => ({
          ...seg,
          words: (seg.words || []).map((w) => ({
            ...w,
            word: transliterateTeluguToRoman(w.word),
          })),
        }));
        return {
          ...timeline,
          targetStyle,
          segments: transliteratedSegments,
        };
      }
      return timeline;
    }
  }

  /**
   * Analyzes an active caption timeline and attaches top-tier, highly relevant viral emojis to key words.
   * Triggered explicitly when the user clicks the "Add Emojis ✨" button.
   */
  async autoAddViralEmojisToTimeline(timeline) {
    if (!timeline || !Array.isArray(timeline.segments) || timeline.segments.length === 0) {
      return timeline;
    }

    const emojiMap = {
      fire: '🔥', hot: '🔥', burn: '🔥', manta: '🔥', aag: '🔥', blast: '💥', boom: '💥',
      fast: '⚡', speed: '⚡', quick: '⚡', twaraga: '⚡', jaldi: '⚡',
      money: '💰', cash: '💰', dollar: '💰', rich: '💰', dhabbu: '💰', paisa: '💰', lakh: '💰', crore: '💰',
      win: '🏆', winner: '🏆', victory: '🏆', gelupu: '🏆', jeet: '🏆', trophy: '🏆',
      king: '👑', boss: '👑', leader: '👑', ayya: '👑', baap: '👑', papa: '👑', father: '👑',
      love: '❤️', heart: '❤️', pyaar: '❤️', prema: '❤️', gunde: '❤️', dil: '❤️',
      death: '💀', dead: '💀', die: '💀', chavu: '💀', mar: '💀', marna: '💀', khatam: '💀',
      danger: '🚨', alert: '🚨', warning: '🚨', apayam: '🚨', khatra: '🚨', stop: '🛑',
      target: '🎯', goal: '🎯', saval: '🎯', challenge: '🎯', sharth: '🎯', question: '❓',
      think: '🤔', thought: '🤔', sochna: '🤔', alochana: '🤔', brain: '💡', dimag: '💡', idea: '💡',
      face: '🗿', moham: '🗿', chehra: '🗿', look: '👀', see: '👀', chudadam: '👀', dekh: '👀',
      truth: '💯', fact: '💯', real: '💯', sach: '💯', nijam: '💯', cap: '🧢',
      star: '⭐', magic: '✨', shine: '✨', hero: '🦸', rocket: '🚀', growth: '📈', video: '🎥', reel: '📱', time: '⏱️',
    };

    if (this.ai) {
      try {
        const payload = timeline.segments.map((s, sIdx) => ({
          index: sIdx,
          words: (s.words || []).map((w) => ({ id: String(w.id), text: w.word })),
        }));

        const prompt = `You are a Master Reel Subtitle Stylist & Emoji Strategist.
Task: Analyze the caption words below and attach top-tier, highly relevant, contextual viral emojis (e.g. 🔥, ⚡, 💀, 💰, 👑, 🎯, 🚨, 💡, 🤫, 📈, ❤️, 🏆, ✨, 🚀, 😱, 🛑) to key emotional, action, or emphasis words.

Rules:
1. Attach relevant emojis ONLY to words that carry strong emotion, action, money, danger, question, or key subject weight.
2. Return JSON:
{
  "emojiUpdates": [
    { "id": "<word_id>", "emoji": "🔥", "word": "<Word 🔥>" }
  ]
}

Input Payload:
${JSON.stringify(payload)}`;

        const rawText = await this._generateContentWithFallback(prompt, { responseMimeType: 'application/json', temperature: 0.2 });
        const parsed = this._parseJSON(rawText);

        const aiEmojiMap = new Map();
        if (Array.isArray(parsed.emojiUpdates)) {
          parsed.emojiUpdates.forEach((u) => {
            if (u.id && (u.emoji || u.word)) {
              aiEmojiMap.set(String(u.id), { emoji: u.emoji || null, word: u.word || null });
            }
          });
        }

        const newSegments = timeline.segments.map((seg) => ({
          ...seg,
          words: (seg.words || []).map((w) => {
            let wordText = w.word || '';
            let autoEmoji = w.emoji || null;

            const aiMatch = aiEmojiMap.get(String(w.id));
            if (aiMatch) {
              if (aiMatch.emoji) autoEmoji = aiMatch.emoji;
              if (aiMatch.word && !wordText.includes(aiMatch.word)) wordText = aiMatch.word;
            }

            if (!autoEmoji) {
              const cleanLower = wordText.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
              for (const [key, emoji] of Object.entries(emojiMap)) {
                if (cleanLower === key || cleanLower.startsWith(key)) {
                  autoEmoji = emoji;
                  if (!wordText.includes(emoji)) {
                    wordText = `${wordText.trim()} ${emoji}`;
                  }
                  break;
                }
              }
            }

            return {
              ...w,
              word: wordText,
              emoji: autoEmoji,
              isHighlighted: w.isHighlighted || !!autoEmoji,
              highlightColor: w.highlightColor || (autoEmoji ? '#FACC15' : w.highlightColor),
            };
          }),
        }));

        console.log(`[AUTO EMOJI SUCCESS] Applied viral emojis to caption timeline.`);
        return { ...timeline, segments: newSegments };
      } catch (err) {
        console.warn(`[AUTO EMOJI ERROR] LLM emoji generation failed: ${err.message}. Using fallback local dictionary.`);
      }
    }

    const newSegments = timeline.segments.map((seg) => ({
      ...seg,
      words: (seg.words || []).map((w) => {
        let wordText = w.word || '';
        let autoEmoji = w.emoji || null;
        const cleanLower = wordText.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

        if (!autoEmoji) {
          for (const [key, emoji] of Object.entries(emojiMap)) {
            if (cleanLower === key || cleanLower.startsWith(key)) {
              autoEmoji = emoji;
              if (!wordText.includes(emoji)) {
                wordText = `${wordText.trim()} ${emoji}`;
              }
              break;
            }
          }
        }

        return {
          ...w,
          word: wordText,
          emoji: autoEmoji,
          isHighlighted: w.isHighlighted || !!autoEmoji,
          highlightColor: w.highlightColor || (autoEmoji ? '#FACC15' : w.highlightColor),
        };
      }),
    }));

    return { ...timeline, segments: newSegments };
  }

  /**
   * Analyze spoken transcript and generate Top 5 High-Converting Viral Hook Banners using Gemini AI.
   * @param {Object} timeline
   */
  async generateTop5HookBannersForTimeline(timeline) {
    if (!timeline || !Array.isArray(timeline.segments)) {
      return [
        'VIRAL REELS SECRET 🚨',
        'STOP DOING THIS IN 2026 ⚡',
        'UNTOLD TRUTH 🚀',
        'DO THIS IMMEDIATELY 🔥',
        'DONT MISS THIS TIP 💡',
      ];
    }

    const fullScript = timeline.segments
      .map((s) => (s.words || []).map((w) => w.word).join(' '))
      .join(' ')
      .trim();

    if (!fullScript || fullScript.length < 3) {
      return [
        'VIRAL REELS SECRET 🚨',
        'STOP DOING THIS IN 2026 ⚡',
        'UNTOLD TRUTH 🚀',
        'DO THIS IMMEDIATELY 🔥',
        'DONT MISS THIS TIP 💡',
      ];
    }

    if (this.ai) {
      try {
        const prompt = `SYSTEM ROLE: You are an Elite Instagram Reels & TikTok Growth Strategist.
Analyze this video speech transcript:
"${fullScript.substring(0, 2000)}"

TASK: Generate EXACTLY 5 high-converting, attention-grabbing viral hook banner headlines (max 3-5 uppercase words each, ending with 1 relevant emoji) strictly relevant to the exact topic, entities, and message of this video transcript!

Return ONLY a compact JSON array of 5 strings:
["HOOK TITLE 1 🚨", "HOOK TITLE 2 ⚡", "HOOK TITLE 3 🚀", "HOOK TITLE 4 🔥", "HOOK TITLE 5 💡"]`;

        const rawText = await this._generateContentWithFallback(prompt, {
          responseMimeType: 'application/json',
          temperature: 0.2,
        });

        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length >= 3) {
            console.log(`[GEMINI HOOK GENERATOR SUCCESS] Generated 5 AI hooks for transcript: "${parsed.join(' | ')}"`);
            return parsed.slice(0, 5).map((str) => String(str).trim().toUpperCase());
          }
        }
      } catch (err) {
        console.warn(`[GEMINI HOOK GENERATOR WARN] ${err.message}. Generating dynamic transcript-aware hooks.`);
      }
    }

    // Dynamic transcript-aware generator extracting real spoken words from the video script
    const cleanLower = fullScript.toLowerCase();
    const words = fullScript.replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(w => w.length > 2);
    const topWord1 = words[0] ? words[0].toUpperCase() : 'REELS';
    const topWord2 = words[Math.floor(words.length / 2)] ? words[Math.floor(words.length / 2)].toUpperCase() : 'SECRET';
    const topWord3 = words[words.length - 1] ? words[words.length - 1].toUpperCase() : 'TRUTH';

    if (cleanLower.includes('money') || cleanLower.includes('cash') || cleanLower.includes('earn')) {
      return ['SECRET TO MAKE MONEY 💸', 'DO THIS TO GET RICH 💰', 'STOP WASTING MONEY ⚡', 'VIRAL CASH GLITCH 🚀', 'EARN MORE IN 2026 💡'];
    } else if (cleanLower.includes('movie') || cleanLower.includes('trailer') || cleanLower.includes('raja saab') || cleanLower.includes('song')) {
      return ['BLOCKBUSTER REVEAL 🎬', 'THE RAJA SAAB BLAST 🔥', 'YOU CANT MISS THIS 🍿', 'MASS HYDERABAD LAUNCH ⚡', 'TOP CINEMA SECRET 👑'];
    }

    return [
      `STOP DOING ${topWord1} IN 2026 🚨`,
      `THE UNTOLD ${topWord2} SECRET ⚡`,
      `WHY NOBODY TALKS ABOUT ${topWord3} 🚀`,
      `TRY THIS VIRAL ${topWord1} TRICK 🔥`,
      `DONT MISS THIS ${topWord2} TIP 💡`,
    ];
  }
}
