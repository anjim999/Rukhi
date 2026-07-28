import fs from 'fs';

/**
 * Optional legacy cloud provider: ElevenLabs TTS API
 */
export async function synthesizeWithElevenLabs({ text, targetLanguage = 'en', outputPath, voiceId }) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('[ElevenLabs] ELEVENLABS_API_KEY environment variable is not configured');
  }

  const selectedVoice = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Rachel default
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`[ElevenLabs] API call failed (${response.status}): ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
  console.log(`[ElevenLabs] ✅ Audio generated via legacy API: ${outputPath}`);
  return outputPath;
}
