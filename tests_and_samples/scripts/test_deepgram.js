import fs from 'fs';
import path from 'path';
import { DeepgramProvider } from './backend/src/services/stt/DeepgramProvider.js';

async function testDeepgram() {
  const provider = new DeepgramProvider({
    apiKey: process.env.DEEPGRAM_API_KEY
  });

  const isAvail = await provider.isAvailable();
  console.log('Deepgram available:', isAvail);

  const audioPath = path.resolve('uploads/test_tts.mp3');
  if (!fs.existsSync(audioPath)) {
    console.error('test_tts.mp3 not found');
    return;
  }

  console.log('Transcribing test audio with Deepgram Nova-3...');
  const result = await provider.transcribe(audioPath, { language: 'en' });
  console.log('Deepgram result text:', result.text);
  console.log('Words count:', result.words?.length);
  if (result.words?.length > 0) {
    console.log('First 3 words with timestamps:', result.words.slice(0, 3));
  }
}

testDeepgram().catch(console.error);
