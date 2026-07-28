import fs from 'fs';

const INDIC_ENDPOINT = process.env.INDIC_TTS_ENDPOINT || 'http://localhost:5000/api/tts/indic';

const INDIC_LANG_MAP = {
  te: 'telugu',
  hi: 'hindi',
  ta: 'tamil',
  kn: 'kannada',
  ml: 'malayalam',
  mr: 'marathi',
  bn: 'bengali',
};

/**
 * Synthesize speech using AI4Bharat Indic-TTS (Specialized Indian regional language engine)
 */
export async function synthesizeWithIndicTTS({ text, targetLanguage = 'te', outputPath, gender = 'male' }) {
  const langName = INDIC_LANG_MAP[targetLanguage] || 'telugu';

  try {
    const response = await fetch(INDIC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language: langName,
        gender,
      }),
    });

    if (!response.ok) {
      throw new Error(`[Indic-TTS] Server returned HTTP status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
    console.log(`[Indic-TTS] ✅ Regional audio synthesized successfully: ${outputPath} (${langName})`);
    return outputPath;
  } catch (err) {
    console.warn(`[Indic-TTS WARNING] Service unavailable: ${err.message}`);
    throw err;
  }
}
