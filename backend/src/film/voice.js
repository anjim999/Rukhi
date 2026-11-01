import { postJson } from './gcp.js';

const TTS_URL = 'https://texttospeech.googleapis.com/v1';

/** List the saved Google voices for a language (free). Only the Chirp 3 HD family is offered. */
export async function listVoices(languageCode) {
  const data = await postJson(`${TTS_URL}/voices?languageCode=${languageCode}`, null, { method: 'GET' });
  return (data.voices || [])
    .filter((v) => v.name.includes('Chirp3-HD'))
    .map((v) => ({ name: v.name, short: v.name.split('-').pop(), gender: v.ssmlGender === 'FEMALE' ? 'female' : 'male' }))
    .sort((a, b) => a.short.localeCompare(b.short));
}

// Whether this project can use the directable (Gemini) speech model; learned on first use.
let directableAvailable = null;

/**
 * Speak one line in a saved voice and return WAV bytes.
 *
 * The voice (a Chirp 3 HD name such as en-IN-Chirp3-HD-Puck) fixes who is speaking. When the
 * directable model is available, `direction` shapes the delivery (sarcastic, sleepy, ...) while
 * keeping that same voice; otherwise the line is read neutrally in the plain Chirp 3 HD voice.
 */
export async function speak({ text, voiceName, languageCode, direction, directableModel }) {
  const audioConfig = { audioEncoding: 'LINEAR16', sampleRateHertz: 48000 };

  if (directableModel && direction && directableAvailable !== false) {
    try {
      const data = await postJson(`${TTS_URL}/text:synthesize`, {
        input: { text, prompt: direction },
        voice: { languageCode, name: voiceName.split('-').pop(), modelName: directableModel },
        audioConfig,
      }, { retries: 1 });
      directableAvailable = true;
      return { buffer: Buffer.from(data.audioContent, 'base64'), model: directableModel };
    } catch (err) {
      // Not enabled, not in this region, or the field names differ: fall back for the rest of the run.
      if (![400, 403, 404].includes(err.status)) throw err;
      if (directableAvailable === null) {
        console.log(`[film] Directable speech model unavailable (${err.message.slice(0, 160)}); using plain Chirp 3 HD voices.`);
      }
      directableAvailable = false;
    }
  }

  const data = await postJson(`${TTS_URL}/text:synthesize`, {
    input: { text },
    voice: { languageCode, name: voiceName },
    audioConfig,
  });
  return { buffer: Buffer.from(data.audioContent, 'base64'), model: 'chirp3-hd' };
}
