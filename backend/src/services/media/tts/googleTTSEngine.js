import fs from 'fs';

const GOOGLE_VOICE_MAP = {
  te: { languageCode: 'te-IN', name: 'te-IN-Standard-A', ssmlGender: 'FEMALE' },
  hi: { languageCode: 'hi-IN', name: 'hi-IN-Neural2-B', ssmlGender: 'MALE' },
  en: { languageCode: 'en-IN', name: 'en-IN-Neural2-D', ssmlGender: 'FEMALE' },
};

/**
 * Synthesize speech using Google Cloud TTS (Neural2 / Journey voices)
 * Uses REST API directly via fetch to avoid requiring heavy SDK setup if credentials are in ENV.
 */
export async function synthesizeWithGoogleTTS({ text, targetLanguage = 'te', outputPath, voiceId }) {
  const apiKey = process.env.GOOGLE_TTS_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('[Google-TTS] Neither GOOGLE_TTS_API_KEY nor GEMINI_API_KEY is configured');
  }

  const voiceConfig = voiceId 
    ? { languageCode: targetLanguage || 'en-US', name: voiceId }
    : (GOOGLE_VOICE_MAP[targetLanguage] || GOOGLE_VOICE_MAP.en);

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: voiceConfig.languageCode,
        name: voiceConfig.name,
        ssmlGender: voiceConfig.ssmlGender || 'NEUTRAL',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`[Google-TTS] Synthesis request failed (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  if (data.audioContent) {
    const buffer = Buffer.from(data.audioContent, 'base64');
    fs.writeFileSync(outputPath, buffer);
    console.log(`[Google-TTS] ✅ Audio synthesized successfully: ${outputPath} (${voiceConfig.name})`);
    return outputPath;
  }

  throw new Error('[Google-TTS] Response missing audioContent payload');
}
