import axiosClient from '../api/axiosClient';

/**
 * Frontend Dubbing & Voice Studio Service
 * Note: axiosClient response interceptor automatically unwraps response.data.
 */

/**
 * Fetch catalog of all available TTS engines and features
 */
export async function getAvailableEngines() {
  const data = await axiosClient.get('/dubbing/engines');
  return data;
}

/**
 * Synthesize dubbed audio voiceover
 */
export async function generateDubbedAudio({ text, targetLanguage = 'te', provider = 'edge', projectId, voiceId }) {
  const data = await axiosClient.post('/dubbing/generate', {
    text,
    targetLanguage,
    provider,
    projectId,
    voiceId,
  });
  return data;
}

/**
 * Transcribe mic audio recording & autocorrect grammar via Gemini Flash ($0 Cost)
 * @param {Blob} audioBlob - HTML5 MediaRecorder recorded audio blob
 * @param {string} [targetLanguage] - Optional language constraint
 */
export async function transcribeVoiceAudio(audioBlob, targetLanguage = 'auto') {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'mic_recording.webm');
  formData.append('targetLanguage', targetLanguage);

  const data = await axiosClient.post('/dubbing/transcribe-speech', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
