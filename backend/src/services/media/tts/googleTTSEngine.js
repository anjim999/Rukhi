import fs from 'fs';
import { getGcpAccessToken } from '../../ai/veoVideoService.js';

const GOOGLE_VOICE_MAP = {
  te: { languageCode: 'te-IN', name: 'te-IN-Standard-A', ssmlGender: 'FEMALE' },
  'te-male': { languageCode: 'te-IN', name: 'te-IN-Standard-B', ssmlGender: 'MALE' },
  'te-female': { languageCode: 'te-IN', name: 'te-IN-Standard-A', ssmlGender: 'FEMALE' },
  hi: { languageCode: 'hi-IN', name: 'hi-IN-Neural2-B', ssmlGender: 'MALE' },
  'hi-male': { languageCode: 'hi-IN', name: 'hi-IN-Neural2-B', ssmlGender: 'MALE' },
  'hi-female': { languageCode: 'hi-IN', name: 'hi-IN-Neural2-A', ssmlGender: 'FEMALE' },
  en: { languageCode: 'en-IN', name: 'en-IN-Neural2-B', ssmlGender: 'MALE' },
  'en-male': { languageCode: 'en-IN', name: 'en-IN-Neural2-B', ssmlGender: 'MALE' },
  'en-female': { languageCode: 'en-IN', name: 'en-IN-Neural2-D', ssmlGender: 'FEMALE' },
  'en-us': { languageCode: 'en-US', name: 'en-US-Neural2-J', ssmlGender: 'MALE' },
};

/**
 * Synthesize speech using Google Cloud TTS (Neural2 / Journey voices)
 * Prefers GCP OAuth 2.0 Access Token (Service Account Key / GCP Cloud Credits),
 * falling back to API Key if unavailable.
 */
export async function synthesizeWithGoogleTTS({ text, targetLanguage = 'te', outputPath, voiceId, gender }) {
  const gcpAccessToken = await getGcpAccessToken();
  const apiKey = process.env.GOOGLE_TTS_API_KEY || process.env.GEMINI_API_KEY;

  if (!gcpAccessToken && !apiKey) {
    throw new Error('[Google-TTS] Neither GCP OAuth Access Token (gcp_key.json) nor GOOGLE_TTS_API_KEY is configured');
  }

  const genderKey = gender ? `${targetLanguage}-${gender.toLowerCase()}` : targetLanguage;
  const voiceConfig = voiceId 
    ? { languageCode: targetLanguage || 'en-US', name: voiceId }
    : (GOOGLE_VOICE_MAP[genderKey] || GOOGLE_VOICE_MAP[targetLanguage] || GOOGLE_VOICE_MAP.en);

  const url = gcpAccessToken
    ? `https://texttospeech.googleapis.com/v1/text:synthesize`
    : `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const headers = { 'Content-Type': 'application/json' };
  if (gcpAccessToken) {
    headers['Authorization'] = `Bearer ${gcpAccessToken}`;
    console.log(`[Google-TTS] 🔑 Using GCP OAuth 2.0 Access Token (GCP Cloud Credits) for voice synthesis...`);
  } else if (apiKey) {
    headers['X-Goog-Api-Key'] = apiKey;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
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
