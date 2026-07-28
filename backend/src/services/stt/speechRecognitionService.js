import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { config } from '../../config/env.js';

const execPromise = util.promisify(exec);

function fileToGenerativePart(filePath, mimeType = 'audio/wav') {
  const fileBuffer = fs.readFileSync(filePath);
  return {
    inlineData: {
      data: fileBuffer.toString('base64'),
      mimeType,
    },
  };
}

/**
 * Transcribe & Autocorrect Spoken Mic Audio using Gemini 2.5 Flash ($0 Cost)
 * Converts browser mic recording to clean 16kHz WAV for 100% accurate transcription.
 */
export async function transcribeAndAutocorrectSpeech({ audioFilePath, mimeType = 'audio/webm', targetLanguage = 'auto' }) {
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('[Speech Recognition] GEMINI_API_KEY environment variable is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Step 1: Convert uploaded browser mic recording (WebM/OGG/AAC) to 16kHz Mono WAV for guaranteed Gemini compatibility
  const wavPath = path.join(path.dirname(audioFilePath), `clean_${path.basename(audioFilePath, path.extname(audioFilePath))}.wav`);
  let finalAudioPath = audioFilePath;
  let finalMimeType = mimeType.split(';')[0].trim();

  try {
    const convertCmd = `ffmpeg -y -i "${audioFilePath}" -ar 16000 -ac 1 "${wavPath}"`;
    await execPromise(convertCmd);
    if (fs.existsSync(wavPath) && fs.statSync(wavPath).size > 0) {
      finalAudioPath = wavPath;
      finalMimeType = 'audio/wav';
      console.log(`[Speech Recognition] 🎵 Converted mic audio to clean WAV: ${wavPath} (${fs.statSync(wavPath).size} bytes)`);
    }
  } catch (ffmpegErr) {
    console.warn(`[Speech Recognition] FFmpeg WAV conversion warning: ${ffmpegErr.message}. Using original mic file.`);
  }

  const audioPart = fileToGenerativePart(finalAudioPath, finalMimeType);

  const prompt = `You are an expert AI Speech Transcriptionist & Grammar Autocorrect Engine for video creators.
Task:
1. Listen carefully to the audio recording (which may contain spoken Telugu, Hindi, English, Teluglish, or Hinglish).
2. Transcribe the spoken speech with 100% precision.
3. Automatically autocorrect any grammatical errors, awkward hesitations (stutters, "um", "ah"), and fix spelling mistakes.
4. Output ONLY the clean, final transcribed text. Do NOT include markdown code blocks, quotes, preamble, or conversational commentary.
Target Language Constraint: ${targetLanguage === 'auto' ? 'Keep in the original native spoken language but with perfect spelling and grammar.' : `Format script into ${targetLanguage}.`}`;

  const modelsToTry = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastErr = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Speech Recognition] 🎙️ Transcribing audio with model '${modelName}'...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([prompt, audioPart]);
      const responseText = result.response.text();
      let cleanedText = responseText ? responseText.trim().replace(/^["'`]|["'`]$/g, '') : '';
      // Strip any timestamp tags like te.00:01 or en.00:02
      cleanedText = cleanedText.replace(/(?:[a-z]{2}\.)?\d{2}:\d{2}\s*/gi, '').trim();

      // Cleanup converted WAV temp file
      try {
        if (finalAudioPath !== audioFilePath && fs.existsSync(finalAudioPath)) {
          fs.unlinkSync(finalAudioPath);
        }
      } catch {}

      console.log(`[Speech Recognition] ✅ Audio transcribed & autocorrected (${cleanedText.length} chars) using ${modelName}: "${cleanedText}"`);
      return cleanedText;
    } catch (err) {
      console.warn(`[Speech Recognition] Model '${modelName}' failed: ${err.message}`);
      lastErr = err;
    }
  }

  // Cleanup temp WAV
  try {
    if (finalAudioPath !== audioFilePath && fs.existsSync(finalAudioPath)) {
      fs.unlinkSync(finalAudioPath);
    }
  } catch {}

  throw lastErr || new Error('[Speech Recognition] Failed to transcribe speech with Gemini models');
}
