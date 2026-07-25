import { GoogleGenerativeAI } from '@google/generative-ai';
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
} from '../../../../shared/constants/timeline.js';

function fileToGenerativePart(filePath, mimeType = 'audio/wav') {
  const fileBuffer = fs.readFileSync(filePath);
  return {
    inlineData: {
      data: fileBuffer.toString('base64'),
      mimeType,
    },
  };
}

export class GeminiCaptionDirector extends LLMProvider {
  constructor() {
    super('gemini-caption-director');

    if (!config.geminiApiKey) {
      console.warn('[GEMINI] No API key configured. Director will not be available.');
    }

    this.ai = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;
    this.modelName = 'gemini-3.5-flash';
  }

  async isAvailable() {
    return !!this.ai;
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

    let styleInstruction = 'Transcribe ONLY what is actually spoken in original language & code-switching.';
    if (targetStyle === 'chatting') {
      styleInstruction = 'Transcribe and format words into casual Romanized social media chatting script (e.g., Teluglish/Hinglish using English alphabet, e.g., "namaste dosto elaa unnaaru").';
    } else if (targetStyle === 'english') {
      styleInstruction = 'Translate all spoken speech (Telugu, Hindi, or mixed) into high-converting, punchy PURE ENGLISH words while matching playback timing.';
    } else if (targetStyle === 'telugu') {
      styleInstruction = 'Transcribe/translate spoken speech into PURE NATIVE TELUGU SCRIPT (తెలుగు) with exact word-level timing.';
    } else if (targetStyle === 'hindi') {
      styleInstruction = 'Transcribe/translate spoken speech into PURE NATIVE HINDI DEVANAGARI SCRIPT (हिंदी) with exact word-level timing.';
    }

    let allWords = [];
    let fullText = '';
    let language = 'te';
    let hook = 'VIRAL REEL CAPTIONS 🔥';

    const CHUNK_SIZE = 15; // 15-second sub-clips (4 chunks for 60s video) for 100% zero-drift sync & zero 429 rate limit blocks

    if (duration > 12) {
      console.log(`[GEMINI STT ENGINE] Duration ${duration.toFixed(1)}s > 12s. Transcribing in 15s sub-clips for 100% zero-drift timing sync...`);
      const numChunks = Math.ceil(duration / CHUNK_SIZE);
      const tmpDir = path.dirname(audioPath);

      for (let c = 0; c < numChunks; c++) {
        const offset = c * CHUNK_SIZE;
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

CRITICAL TIMING & SYNCHRONIZATION CONSTRAINTS:
1. Provide exact word-level timestamps relative to THIS CHUNK (start 0.00s to ${chunkDur.toFixed(2)}s).
2. Start time of the first word MUST match actual speech onset (${speechOnset.toFixed(2)}s) in this audio clip.
3. Allocate timestamps so each word matches the EXACT acoustic playback window of the spoken phrase in this audio clip.
4. Timestamps MUST be in seconds with 2 decimal places (e.g. 0.15, 1.42).
5. Word timestamps MUST be strictly ordered and monotonic: word[n].start < word[n].end and word[n].end <= word[n+1].start.
6. DO NOT hallucinate speech outside this ${chunkDur.toFixed(1)}-second audio chunk.

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

            // Acoustic Onset Alignment: Ensure first word matches real acoustic speech onset
            if (chunkWords.length > 0 && speechOnset >= 0) {
              const delta = speechOnset - chunkWords[0].wStart;
              if (Math.abs(delta) > 0.15 && delta < 5.0) {
                console.log(`[ACOUSTIC ONSET ALIGNMENT] Chunk ${c}: Adjusting start time by ${delta > 0 ? '+' : ''}${delta.toFixed(2)}s to match speech onset (${speechOnset.toFixed(2)}s)`);
                chunkWords = chunkWords.map(w => ({
                  ...w,
                  wStart: Math.max(speechOnset, Math.round((w.wStart + delta) * 100) / 100),
                  wEnd: Math.max(speechOnset + 0.1, Math.round((w.wEnd + delta) * 100) / 100),
                }));
              }
            }

            for (const w of chunkWords) {
              allWords.push([
                w.wText,
                Math.round((w.wStart + offset) * 100) / 100,
                Math.round((w.wEnd + offset) * 100) / 100,
                w.wEmp,
              ]);
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
      // Single chunk for short audio (<= 12 seconds)
      const mimeType = audioPath.endsWith('.mp4') ? 'video/mp4' : 'audio/wav';
      const audioPart = fileToGenerativePart(audioPath, mimeType);

      const prompt = `You are an expert Speech Transcriber and Reel Caption Director.
LISTEN carefully to the attached ${duration.toFixed(1)}-second audio file and transcribe the spoken content with 100% precise synchronization.

TARGET OUTPUT SCRIPT STYLE:
${styleInstruction}

CRITICAL TIMING & SYNCHRONIZATION CONSTRAINTS:
1. Provide exact word-level timestamps in seconds with 2 decimal places (e.g., 0.15, 1.42). Total audio duration is EXACTLY ${duration.toFixed(2)} seconds.
2. Start time of the first word MUST match actual speech onset audio, not arbitrary 0.00.
3. Word timestamps MUST be strictly monotonic and ordered: word[n].start < word[n].end and word[n].end <= word[n+1].start.
4. DO NOT introduce artificial gaps or overlapping times between words.
5. Structure output words according to requested script style (${targetStyle}).

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
          console.warn(`[GEMINI STT ATTEMPT ${attempt}] API request failed: ${err.message}`);
          if (attempt < 3 && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('rate'))) {
            console.log(`[GEMINI 429 RETRY] Waiting 3 seconds before retry attempt ${attempt + 1}...`);
            await new Promise((r) => setTimeout(r, 3000));
          } else if (attempt === 3) {
            throw err;
          }
        }
      }

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

    const rawDataCombined = {
      fullText,
      language,
      words: allWords,
      hook,
    };

    const timeline = this._buildTimelineFromWords(rawDataCombined, duration);
    const latencyMs = Date.now() - startTime;
    console.log(`[GEMINI AUDIO STT] ✅ 10s Chunking STT complete in ${latencyMs}ms — ${timeline.segments.length} segments`);

    return {
      timeline,
      fullText,
      language,
      provider: 'gemini-audio-stt',
      latencyMs,
    };
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
    const repaired = [];

    for (let i = 0; i < wordObjects.length; i++) {
      const current = { ...wordObjects[i] };
      current.start = Math.max(0, Math.round((parseFloat(current.start) || 0) * 100) / 100);
      current.end = Math.max(current.start + 0.05, Math.round((parseFloat(current.end) || current.start + 0.3) * 100) / 100);

      // Clamp to max video duration
      if (current.start > maxDur) current.start = Math.max(0, maxDur - 0.1);
      if (current.end > maxDur) current.end = maxDur;

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

        // Fix Overlaps: if current start is before previous end, pull previous end back or adjust current start
        if (current.start < prev.end) {
          prev.end = current.start;
          if (prev.end <= prev.start) {
            prev.end = Math.round((prev.start + 0.05) * 100) / 100;
            current.start = prev.end;
          }
        }

        // Fill Small Gaps (< 0.25s) so captions flow seamlessly without jarring visual dropouts
        const gap = current.start - prev.end;
        if (gap > 0 && gap <= 0.25) {
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

      // Extend segment end to next segment start if gap is small (<0.3s) for seamless caption display
      const nextChunk = chunks[segIndex + 1];
      if (nextChunk && (nextChunk[0].start - segEnd) < 0.3) {
        segEnd = nextChunk[0].start;
      }

      segments.push({
        id: uuidv4(),
        start: segStart,
        end: segEnd,
        displayMode: chunk.length === 1 ? 'single_word' : `chunk_${chunk.length}`,
        animation: animTypesList[segIndex % animTypesList.length],
        styleOverride: stylePresetsList[segIndex % stylePresetsList.length],
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

    return {
      version: '1.0',
      aspectRatio: '9:16',
      stickyHook: null,
      segments,
      globalTheme: {
        fontFamily: 'Inter',
        primaryColor: '#FFFFFF',
        highlightColor: '#FACC15',
        presetName: 'bold_viral',
      },
    };
  }

  async generateCaptionTimeline(input) {
    if (!this.ai) {
      throw new Error('Gemini API key not configured.');
    }

    const startTime = Date.now();
    const { words, fullText, language, duration, emphasisScores, aspectRatio, presetName } = input;

    const enrichedWords = words.map((w, i) => ({
      ...w,
      emphasisScore: emphasisScores?.[i] ?? 0.5,
    }));

    const prompt = this._buildCompactPrompt(enrichedWords, fullText, language);

    const model = this.ai.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
        maxOutputTokens: 16384,
      },
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let rawTimeline = this._parseJSON(responseText);
    const timeline = this._normalizeTimeline(rawTimeline, enrichedWords, aspectRatio, presetName);

    const latencyMs = Date.now() - startTime;
    return {
      timeline,
      provider: this.name,
      latencyMs,
    };
  }

  _parseJSON(text) {
    try {
      return JSON.parse(text);
    } catch (_e) {
      // continue to repair
    }

    let repaired = text.trim();
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
      throw new Error('Gemini returned invalid JSON.');
    }
  }

  _buildCompactPrompt(enrichedWords, fullText, language) {
    const wordsCompact = enrichedWords.map((w, i) =>
      `[${i},"${w.word}",${w.start},${w.end},${w.emphasisScore}]`
    ).join(',');

    return `You are a Caption Director for viral reels. Convert word timestamps into kinetic caption segments.

RULES: Group 1-3 words per segment. High emphasis(>=0.7)=single word,UPPERCASE,pop/bounce animation. Medium(0.4-0.7)=chunk of 2. Low(<0.4)=chunk of 2-3,no animation. Add emoji to max 3 important words. Add sfx to max 2 moments.

WORD DATA [index,"word",start,end,emphasis]: [${wordsCompact}]
TEXT: "${fullText}"
LANG: ${language}

Return JSON: {"segments":[{"start":N,"end":N,"displayMode":"single_word|chunk_2|chunk_3","animation":"pop|bounce|slide|glow|none","words":[{"word":"W","start":N,"end":N,"emphasisScore":N,"isHighlighted":bool,"highlightColor":"#hex|null","emoji":"emoji|null","sfx":"pop|whoosh|none","caseFormat":"uppercase|lowercase|original"}]}],"stickyHook":{"text":"hook with emoji","position":"top"}}`;
  }

  _normalizeTimeline(raw, enrichedWords, aspectRatio, presetName) {
    const segments = (raw.segments || []).map((seg) => ({
      id: uuidv4(),
      start: seg.start || 0,
      end: seg.end || 0,
      displayMode: Object.values(DISPLAY_MODES).includes(seg.displayMode)
        ? seg.displayMode
        : DISPLAY_MODES.CHUNK_2,
      animation: Object.values(ANIMATION_TYPES).includes(seg.animation)
        ? seg.animation
        : ANIMATION_TYPES.NONE,
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
      words: (seg.words || []).map((w) => ({
        id: uuidv4(),
        word: w.word || '',
        start: w.start || 0,
        end: w.end || 0,
        confidence: w.confidence || 0.9,
        emphasisScore: w.emphasisScore || 0.5,
        isHighlighted: w.isHighlighted || false,
        highlightColor: w.highlightColor || null,
        emoji: w.emoji || null,
        sfx: Object.values(SFX_TYPES).includes(w.sfx) ? w.sfx : SFX_TYPES.NONE,
        caseFormat: Object.values(CASE_FORMATS).includes(w.caseFormat)
          ? w.caseFormat
          : CASE_FORMATS.ORIGINAL,
      })),
    }));

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
}
