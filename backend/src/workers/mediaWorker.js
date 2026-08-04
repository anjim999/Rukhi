import { Worker } from 'bullmq';
import { redisConnection, QUEUE_NAMES } from '../services/queue/queueService.js';
import { extractAudio, probeVideo, generateWaveformPeaks, webOptimizeVideo, detectSpeechOnset, denoiseAudioForSTT } from '../services/media/ffmpegService.js';
import { separateVocals, cleanupDemucsOutput } from '../services/media/demucsService.js';
import { DeepgramProvider } from '../services/stt/DeepgramProvider.js';
import { LocalWhisperProvider } from '../services/stt/LocalWhisperProvider.js';
import { GeminiCaptionDirector } from '../services/llm/GeminiCaptionDirector.js';
import * as projectService from '../services/projectService.js';
import { PROJECT_STATUSES } from '../../shared/constants/timeline.js';


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

async function isProjectCancelled(projectId) {
  try {
    const proj = await projectService.getProject(projectId);
    return proj && (proj.status === PROJECT_STATUSES.CANCELLED || proj.status === 'cancelled');
  } catch (_e) {
    return false;
  }
}

async function processMediaJob(job) {
  const { projectId, videoPath, userId, targetStyle = 'auto', applyEmojis = false } = job.data;
  console.log(`[WORKER] Starting media processing for project ${projectId} (Style: ${targetStyle}, Emojis: ${applyEmojis})`);

  try {
    if (await isProjectCancelled(projectId)) {
      console.log(`[WORKER] ⛔ Project ${projectId} generation was cancelled before start. Terminating.`);
      return { projectId, status: 'cancelled' };
    }

    await job.updateProgress(10);
    const videoMeta = await probeVideo(videoPath);
    console.log(`[WORKER] Video probed: ${videoMeta.duration}s, ${videoMeta.width}x${videoMeta.height}`);

    if (await isProjectCancelled(projectId)) {
      console.log(`[WORKER] ⛔ Project ${projectId} generation was cancelled after probe. Terminating.`);
      return { projectId, status: 'cancelled' };
    }

    // Web-Optimize uploaded clip for 100% mobile browser and Instagram reel compatibility
    const webOptimizedPath = videoPath.replace(/(\.[^.]+)$/, '_web.mp4');
    let processedVideoPath = videoPath;
    try {
      processedVideoPath = await webOptimizeVideo(videoPath, webOptimizedPath);
    } catch (optErr) {
      console.warn(`[WORKER WARNING] Web optimization skipped: ${optErr.message}`);
    }

    if (await isProjectCancelled(projectId)) {
      console.log(`[WORKER] ⛔ Project ${projectId} generation was cancelled during web optimization. Terminating.`);
      return { projectId, status: 'cancelled' };
    }

    await projectService.updateProjectStatus(projectId, PROJECT_STATUSES.EXTRACTING_AUDIO, {
      duration: videoMeta.duration,
    });

    await job.updateProgress(15);
    const rawAudioPath = await extractAudio(videoPath, projectId);

    if (await isProjectCancelled(projectId)) {
      console.log(`[WORKER] ⛔ Project ${projectId} generation was cancelled after audio extraction. Terminating.`);
      return { projectId, status: 'cancelled' };
    }

    await projectService.updateProjectStatus(projectId, PROJECT_STATUSES.TRANSCRIBING, {
      audioUrl: rawAudioPath,
    });

    // Detect exact physical speech acoustic onset for word-start alignment
    const acousticOnsetSec = await detectSpeechOnset(rawAudioPath).catch(() => 0);

    if (await isProjectCancelled(projectId)) {
      console.log(`[WORKER] ⛔ Project ${projectId} generation was cancelled after audio extraction. Terminating.`);
      return { projectId, status: 'cancelled' };
    }

    await job.updateProgress(35);
    const waveformPeaks = await generateWaveformPeaks(rawAudioPath, 200).catch(() => []);

    if (await isProjectCancelled(projectId)) {
      console.log(`[WORKER] ⛔ Project ${projectId} generation was cancelled after waveform. Terminating.`);
      return { projectId, status: 'cancelled' };
    }

    await job.updateProgress(40);
    let timeline;

    console.log(`[WORKER] 🚀 Streaming raw audio directly to Gemini 2.5 Flash Native Multilingual Audio Engine (Target Style: ${targetStyle}, Duration: ${videoMeta.duration}s)...`);
    await projectService.updateProjectStatus(projectId, PROJECT_STATUSES.ANALYZING);

    const result = await captionDirector.generateCaptionTimelineFromAudio({
      audioPath: rawAudioPath,
      duration: videoMeta.duration,
      aspectRatio: '9:16',
      presetName: 'bold_viral',
      targetStyle,
      applyEmojis,
    });

    timeline = result?.timeline;

    // Acoustic Onset Fine-Tuning: Align initial subtitle card start with real physical speech onset
    if (timeline?.segments?.[0]?.words?.[0] && acousticOnsetSec > 0.05 && acousticOnsetSec < 4.0) {
      const firstWord = timeline.segments[0].words[0];
      if (Math.abs(firstWord.start - acousticOnsetSec) <= 1.5) {
        console.log(`[WORKER SYNC] Fine-tuning initial word "${firstWord.word}" start from ${firstWord.start}s to acoustic onset ${acousticOnsetSec}s`);
        firstWord.start = acousticOnsetSec;
        timeline.segments[0].start = acousticOnsetSec;
      }
    }

    if (await isProjectCancelled(projectId)) {
      console.log(`[WORKER] ⛔ Project ${projectId} generation was cancelled before timeline save. Terminating.`);
      return { projectId, status: 'cancelled' };
    }

    await job.updateProgress(90);

    if (timeline) {
      timeline.targetStyle = targetStyle;
    }

    await projectService.saveTimeline(projectId, timeline);
    await projectService.updateProjectStatus(projectId, PROJECT_STATUSES.COMPLETED);

    // Cleanup Demucs temporary files to save disk space
    await cleanupDemucsOutput(projectId);

    await job.updateProgress(100);
    console.log(`[WORKER] ✅ Media processing completed for project ${projectId}`);

    return { projectId, status: 'completed' };
  } catch (err) {
    if (await isProjectCancelled(projectId)) {
      console.log(`[WORKER] ⛔ Project ${projectId} was cancelled during exception. Exit safely.`);
      return { projectId, status: 'cancelled' };
    }
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
