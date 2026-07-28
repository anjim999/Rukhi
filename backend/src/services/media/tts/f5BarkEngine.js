import fs from 'fs';

const F5_BARK_ENDPOINT = process.env.F5_BARK_ENDPOINT || 'http://localhost:7860/api/predict';

/**
 * Synthesize conversational audio with non-speech vocal sounds using F5-TTS / Suno Bark
 */
export async function synthesizeWithF5Bark({ text, targetLanguage = 'en', outputPath }) {
  try {
    // Process text for Bark non-verbal tags e.g. [laughter], [sighs], [gasp]
    const response = await fetch(F5_BARK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [text, targetLanguage],
      }),
    });

    if (!response.ok) {
      throw new Error(`[F5/Bark] API endpoint error ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
    console.log(`[F5/Bark] ✅ Conversational speech generated: ${outputPath}`);
    return outputPath;
  } catch (err) {
    console.warn(`[F5/Bark WARNING] Service unavailable: ${err.message}`);
    throw err;
  }
}
