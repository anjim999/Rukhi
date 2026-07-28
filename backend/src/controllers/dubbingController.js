import path from 'path';
import fs from 'fs';
import { generateDubbedVoiceoverAudio } from '../services/media/dubbingService.js';
import { TTS_PROVIDERS } from '../services/media/tts/ttsEngineManager.js';
import { transcribeAndAutocorrectSpeech } from '../services/stt/speechRecognitionService.js';

/**
 * Controller to handle AI Audio Dubbing & Speech Synthesis Requests
 */
export async function generateDubbing(req, res, next) {
  try {
    const { text, targetLanguage = 'te', provider = TTS_PROVIDERS.EDGE, voiceId, speakerWavPath, projectId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text prompt/script is required for dubbing' });
    }

    const effectiveProjectId = projectId || `dub_${Date.now()}`;

    const audioFilePath = await generateDubbedVoiceoverAudio({
      text,
      targetLanguage,
      projectId: effectiveProjectId,
      provider,
      voiceId,
      speakerWavPath,
    });

    if (!audioFilePath) {
      return res.status(500).json({ success: false, error: 'Audio synthesis failed across all available TTS engines' });
    }

    const fileName = path.basename(audioFilePath);
    const publicAudioUrl = `/uploads/${fileName}`;

    return res.json({
      success: true,
      audioUrl: publicAudioUrl,
      fileName,
      provider,
      targetLanguage,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Transcribe & Autocorrect Spoken Mic Audio via Gemini 2.5 Flash ($0 Cost)
 */
export async function transcribeSpeechInput(req, res, next) {
  try {
    console.log('[DUBBING CONTROLLER] 📥 /api/dubbing/transcribe-speech received');
    if (!req.file) {
      console.warn('[DUBBING CONTROLLER] Missing req.file payload');
      return res.status(400).json({ success: false, error: 'Mic audio file payload is required' });
    }

    const audioFilePath = req.file.path;
    const mimeType = req.file.mimetype || 'audio/webm';
    const targetLanguage = req.body.targetLanguage || 'auto';

    console.log(`[DUBBING CONTROLLER] Processing mic audio: ${audioFilePath} (${req.file.size} bytes, MIME: ${mimeType}, lang: ${targetLanguage})`);

    const transcribedScript = await transcribeAndAutocorrectSpeech({
      audioFilePath,
      mimeType,
      targetLanguage,
    });

    console.log(`[DUBBING CONTROLLER] ✅ Transcription result (${transcribedScript.length} chars): "${transcribedScript}"`);

    // Cleanup temp mic file after transcription
    try {
      if (fs.existsSync(audioFilePath)) {
        fs.unlinkSync(audioFilePath);
      }
    } catch (cleanupErr) {
      console.warn('Failed to delete temp mic audio file:', cleanupErr.message);
    }

    return res.json({
      success: true,
      script: transcribedScript,
      targetLanguage,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to list all supported TTS Engines, voices, and features
 */
export async function getEngines(_req, res) {
  return res.json({
    success: true,
    engines: [
      {
        id: TTS_PROVIDERS.EDGE,
        name: 'Microsoft Edge Neural TTS',
        badge: '100% Free & Unlimited',
        description: 'Ultra-fast, crystal clean natural voices with zero quota limits.',
        languages: ['te', 'hi', 'en', 'ta', 'kn', 'ml', 'mr', 'bn'],
        features: ['Zero Cost', 'Instant Network Render', 'Native Regional Voices'],
        defaultVoice: { te: 'te-IN-MohanNeural', hi: 'hi-IN-MadhurNeural', en: 'en-IN-PrabhatNeural' }
      },
      {
        id: TTS_PROVIDERS.GOOGLE,
        name: 'Google Cloud Neural2 / Journey',
        badge: '1M Free Chars/Mo',
        description: 'Expressive neural speech with natural tone and pitch inflections.',
        languages: ['te', 'hi', 'en', 'ta', 'bn'],
        features: ['Expressive Tone', 'Studio Quality', 'Google Neural Engine'],
        defaultVoice: { te: 'te-IN-Standard-A', hi: 'hi-IN-Neural2-B', en: 'en-IN-Neural2-D' }
      },
      {
        id: TTS_PROVIDERS.INDIC,
        name: 'AI4Bharat Indic-TTS',
        badge: 'Native Dialects',
        description: 'Specialized Indian regional dialect and script pronunciation engine by IIT Madras.',
        languages: ['te', 'hi', 'ta', 'kn', 'ml', 'mr', 'bn'],
        features: ['Pure Indian Accents', 'Script Precision', 'Regional Dialects']
      },
      {
        id: TTS_PROVIDERS.XTTS,
        name: 'Coqui XTTS v2 Voice Clone',
        badge: '3-Sec Voice Clone',
        description: 'Clones any voice from a 3-second sample with human emotional resonance.',
        languages: ['en', 'hi'],
        features: ['Voice Cloning', 'Custom Speaker Samples', 'Human Breaths']
      },
      {
        id: TTS_PROVIDERS.F5_BARK,
        name: 'F5-TTS / Suno Bark',
        badge: 'Conversational Cues',
        description: 'Generates non-verbal acoustics like laughter [laughter], sighs [sigh], and hesitations.',
        languages: ['en', 'hi'],
        features: ['Non-Speech Acoustics', 'Laughs & Sighs', 'Storytelling Flow']
      },
      {
        id: TTS_PROVIDERS.ELEVENLABS,
        name: 'ElevenLabs Multilingual',
        badge: 'Optional Legacy',
        description: 'Commercial cloud TTS provider (requires ELEVENLABS_API_KEY).',
        languages: ['en', 'hi', 'te'],
        features: ['Proprietary Cloud', 'Multilingual v2']
      }
    ]
  });
}
