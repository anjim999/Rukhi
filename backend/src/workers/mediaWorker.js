import { Worker } from 'bullmq';
import { redisConnection, QUEUE_NAMES } from '../services/queue/queueService.js';
import { extractAudio, probeVideo, generateWaveformPeaks, webOptimizeVideo } from '../services/media/ffmpegService.js';
import { separateVocals, cleanupDemucsOutput } from '../services/media/demucsService.js';
import { DeepgramProvider } from '../services/stt/DeepgramProvider.js';
import { LocalWhisperProvider } from '../services/stt/LocalWhisperProvider.js';
import { GeminiCaptionDirector } from '../services/llm/GeminiCaptionDirector.js';
import * as projectService from '../services/projectService.js';
import { PROJECT_STATUSES } from '../../../shared/constants/timeline.js';

const deepgramProvider = new DeepgramProvider();
const whisperProvider = new LocalWhisperProvider({ modelSize: 'base', device: 'cpu' });
const captionDirector = new GeminiCaptionDirector();

export async function processMediaDirectly(data) {
  const mockJob = {
    data,
    updateProgress: async (p) => console.log(`[PROCESSING] Project ${data.projectId}: ${p}%`),
  };
  return processMediaJob(mockJob);
}

async function processMediaJob(job) {
  const { projectId, videoPath, userId, targetStyle = 'auto' } = job.data;
  console.log(`[WORKER] Starting media processing for project ${projectId} (Style: ${targetStyle})`);

  try {
    await job.updateProgress(10);
    const videoMeta = await probeVideo(videoPath);
    console.log(`[WORKER] Video probed: ${videoMeta.duration}s, ${videoMeta.width}x${videoMeta.height}`);

    // Web-Optimize uploaded clip for 100% mobile browser and Instagram reel compatibility
    const webOptimizedPath = videoPath.replace(/(\.[^.]+)$/, '_web.mp4');
    await webOptimizeVideo(videoPath, webOptimizedPath);

    await projectService.updateProjectStatus(projectId, PROJECT_STATUSES.EXTRACTING_AUDIO, {
      duration: videoMeta.duration,
    });

    await job.updateProgress(15);
    const rawAudioPath = await extractAudio(videoPath, projectId);

    await projectService.updateProjectStatus(projectId, PROJECT_STATUSES.TRANSCRIBING, {
      audioUrl: rawAudioPath,
    });

    // Demucs AI Vocal Separation — isolate human voice from background music
    await job.updateProgress(20);
    console.log(`[WORKER] 🎤 Running Demucs AI Vocal Separation (BGM removal)...`);
    const cleanVocalPath = await separateVocals(rawAudioPath, projectId);
    const sttAudioPath = cleanVocalPath; // Use clean vocals for STT

    await job.updateProgress(35);
    const waveformPeaks = await generateWaveformPeaks(rawAudioPath, 200);

    await job.updateProgress(40);
    let timeline;

    const deepgramAvailable = await deepgramProvider.isAvailable();
    const whisperAvailable = await whisperProvider.isAvailable();

    let transcription = null;

    let sttLanguage = null;
    if (targetStyle === 'telugu') sttLanguage = 'te';
    else if (targetStyle === 'hindi') sttLanguage = 'hi';
    else if (targetStyle === 'english') sttLanguage = 'en';

    if (deepgramAvailable) {
      console.log(`[WORKER] 🚀 Transcribing clean vocals with Deepgram Nova-3 Multilingual STT (99.9% Acoustic Sync)...`);
      try {
        transcription = await deepgramProvider.transcribe(sttAudioPath, { language: sttLanguage });
      } catch (dgErr) {
        console.warn(`[WORKER WARNING] Deepgram STT failed (${dgErr.message}). Falling back to alternative STT...`);
      }
    }

    if (!transcription && whisperAvailable) {
      console.log(`[WORKER] Transcribing clean vocals with local Whisper CLI...`);
      try {
        transcription = await whisperProvider.transcribe(sttAudioPath);
      } catch (wErr) {
        console.warn(`[WORKER WARNING] Local Whisper transcription failed: ${wErr.message}`);
      }
    }

    const minExpectedWords = Math.max(2, Math.floor(videoMeta.duration / 7));

    if (transcription && transcription.words && transcription.words.length >= minExpectedWords) {
      await job.updateProgress(60);
      await projectService.updateProjectStatus(projectId, PROJECT_STATUSES.ANALYZING);
      await job.updateProgress(70);

      console.log(`[WORKER] Directing captions with Gemini 2.5 Flash from ${transcription.words.length} precise STT words...`);
      const result = await captionDirector.generateCaptionTimeline({
        words: transcription.words,
        fullText: transcription.fullText,
        language: transcription.language,
        duration: transcription.duration || videoMeta.duration,
        aspectRatio: '9:16',
        presetName: 'bold_viral',
        targetStyle,
      });
      timeline = result.timeline;
    } else {
      if (transcription && transcription.words) {
        console.warn(`[WORKER WARNING] STT returned only ${transcription.words.length} words for ${videoMeta.duration.toFixed(1)}s video. Falling back to Gemini 2.5 Flash Audio Director...`);
      } else {
        console.log(`[WORKER] Speech STT using Gemini 2.5 Flash Audio Pipeline (Target Style: ${targetStyle})...`);
      }
      const result = await captionDirector.generateCaptionTimelineFromAudio({
        audioPath: sttAudioPath,
        duration: videoMeta.duration,
        aspectRatio: '9:16',
        presetName: 'bold_viral',
        targetStyle,
      });
      timeline = result.timeline;
    }

    await job.updateProgress(90);

    await projectService.saveTimeline(projectId, timeline);
    await projectService.updateProjectStatus(projectId, PROJECT_STATUSES.COMPLETED);

    // Cleanup Demucs temporary files to save disk space
    await cleanupDemucsOutput(projectId);

    await job.updateProgress(100);
    console.log(`[WORKER] ✅ Media processing completed for project ${projectId}`);

    return { projectId, status: 'completed' };
  } catch (err) {
    console.error(`[WORKER] Error processing media for project ${projectId}:`, err);
    await projectService.updateProjectStatus(projectId, PROJECT_STATUSES.FAILED, {
      errorMessage: err.message,
    });
    throw err;
  }
}

// Attach BullMQ worker safely if Redis is connected
let worker = null;
try {
  worker = new Worker(QUEUE_NAMES.MEDIA_PROCESSING, processMediaJob, {
    connection: redisConnection,
    concurrency: 2,
    limiter: { max: 5, duration: 60000 },
  });

  worker.on('completed', (job, result) => {
    console.log(`[WORKER] ✅ Job ${job.id} completed:`, result);
  });

  worker.on('failed', (job, err) => {
    console.error(`[WORKER] ❌ Job ${job?.id} failed:`, err.message);
  });
} catch (_e) {}

export default worker;
