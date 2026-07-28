import fs from 'fs';

const XTTS_ENDPOINT = process.env.XTTS_ENDPOINT || 'http://localhost:8020/tts_stream';

/**
 * Synthesize speech using XTTS v2 (Local / Remote Voice Cloning)
 * @param {Object} params
 * @param {string} params.text - Text script
 * @param {string} params.targetLanguage - Language code ('en', 'hi', etc.)
 * @param {string} params.speakerWavPath - Optional reference audio snippet for 3-second voice cloning
 * @param {string} params.outputPath - Output MP3 path
 */
export async function synthesizeWithXTTS({ text, targetLanguage = 'en', speakerWavPath, outputPath }) {
  try {
    const payload = {
      text,
      language: targetLanguage === 'hi' ? 'hi' : 'en',
      speaker_wav: speakerWavPath || null,
    };

    const response = await fetch(XTTS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`[XTTS v2] Server error HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
    console.log(`[XTTS v2] ✅ Voice clone audio synthesized: ${outputPath}`);
    return outputPath;
  } catch (err) {
    console.warn(`[XTTS WARNING] Local XTTS server unavailable: ${err.message}`);
    throw err;
  }
}
