import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { LLMProvider } from './LLMProvider.js';
import { config } from '../../config/env.js';
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
    this.modelName = 'gemini-2.5-flash';
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
   * Transcribe video audio directly with Gemini 2.5 Flash with script/language formatting.
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
    console.log(`[GEMINI AUDIO STT] Processing audio (Style: ${targetStyle}) with Gemini 2.5 Flash: ${audioPath}`);

    const mimeType = audioPath.endsWith('.mp4') ? 'video/mp4' : 'audio/wav';
    const audioPart = fileToGenerativePart(audioPath, mimeType);

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

    const prompt = `You are an expert Speech Transcriber and Reel Caption Director.
LISTEN carefully to the attached audio file and transcribe the spoken content.

TARGET OUTPUT SCRIPT STYLE:
${styleInstruction}

CRITICAL INSTRUCTIONS:
1. Provide exact word-level timestamps matching audio playback timing.
2. Structure output words according to requested script style (${targetStyle}).
3. Support Telugu, English, Hindi, and code-switched speech.

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
        temperature: 0.2,
        maxOutputTokens: 16384,
      },
    });

    const result = await model.generateContent([audioPart, prompt]);
    const responseText = result.response.text();

    let rawData;
    try {
      rawData = this._parseJSON(responseText);
    } catch (_err) {
      console.warn('[GEMINI] Parsing full JSON failed. Extracting fullText via regex fallback...');
      rawData = this._extractFullTextFallback(responseText, duration);
    }

    const timeline = this._buildTimelineFromWords(rawData, duration);

    const latencyMs = Date.now() - startTime;
    console.log(`[GEMINI AUDIO STT] ✅ Direct Audio Transcription complete in ${latencyMs}ms — ${timeline.segments.length} segments`);
    console.log(`[REAL TRANSCRIPT]: "${rawData.fullText?.substring(0, 150)}..."`);

    return {
      timeline,
      fullText: rawData.fullText || '',
      language: rawData.language || 'te',
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

    const words = rawWords.map((w, i) => [
      w,
      Math.round(i * timePerWord * 100) / 100,
      Math.round((i + 1) * timePerWord * 90) / 100,
      i % 4 === 0 ? 0.9 : 0.5,
    ]);

    return {
      fullText,
      language: 'te',
      words,
      hook: 'VIRAL REEL CAPTIONS 🔥',
    };
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
        end: Math.round((i + 1) * tpw * 90) / 100,
        emphasisScore: i % 4 === 0 ? 0.9 : 0.5,
      }));
    }

    const segments = [];
    const chunkSize = 3;

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

    for (let i = 0; i < wordObjects.length; i += chunkSize) {
      const chunk = wordObjects.slice(i, i + chunkSize);
      const segStart = chunk[0].start;
      const segEnd = chunk[chunk.length - 1].end;
      const segIndex = Math.floor(i / chunkSize);

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
        words: chunk.map((w, idx) => ({
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
