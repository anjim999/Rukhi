import { Worker } from 'bullmq';
import { redisConnection, QUEUE_NAMES } from '../services/queue/queueService.js';
import { extractAudio, probeVideo, generateWaveformPeaks } from '../services/media/ffmpegService.js';
import { LocalWhisperProvider } from '../services/stt/LocalWhisperProvider.js';
import { GeminiCaptionDirector } from '../services/llm/GeminiCaptionDirector.js';
import * as projectService from '../services/projectService.js';
import { PROJECT_STATUSES } from '../../../shared/constants/timeline.js';

const sttProvider = new LocalWhisperProvider({ modelSize: 'base', device: 'cpu' });
const captionDirector = new GeminiCaptionDirector();

async function processMediaJob(job) {
  const { projectId, videoPath, userId } = job.data;
  console.log(`[WORKER] Starting media processing for project ${projectId}`);

  try {
    // ── Step 1: Probe Video ──────────────────────────────────────
    await job.updateProgress(10);
    const videoMeta = await probeVideo(videoPath);
    console.log(`[WORKER] Video probed: ${videoMeta.duration}s, ${videoMeta.width}x${videoMeta.height}`);

    await projectService.updateProjectStatus(projectId, PROJECT_STATUSES.EXTRACTING_AUDIO, {
      duration: videoMeta.duration,
    });

    // ── Step 2: Extract Audio via Static FFmpeg ────────────────
    await job.updateProgress(20);
    const audioPath = await extractAudio(videoPath, projectId);

    await projectService.updateProjectStatus(projectId, PROJECT_STATUSES.TRANSCRIBING, {
      audioUrl: audioPath,
    });

    // ── Step 3: Waveform Peaks ───────────────────────────────────
    await job.updateProgress(30);
    const waveformPeaks = await generateWaveformPeaks(audioPath, 200);

    // ── Step 4 & 5: Gemini 2.5 Flash Audio STT & Caption Director ──
    await job.updateProgress(40);
    let timeline;

    const sttAvailable = await sttProvider.isAvailable();
    const llmAvailable = await captionDirector.isAvailable();

    if (sttAvailable) {
      console.log(`[WORKER] Transcribing audio with local Whisper CLI...`);
      const transcription = await sttProvider.transcribe(audioPath);
      await job.updateProgress(60);

      await projectService.updateProjectStatus(projectId, PROJECT_STATUSES.ANALYZING);
      await job.updateProgress(70);

      const result = await captionDirector.generateCaptionTimeline({
        words: transcription.words,
        fullText: transcription.fullText,
        language: transcription.language,
        duration: transcription.duration,
        aspectRatio: '9:16',
        presetName: 'bold_viral',
      });
      timeline = result.timeline;

    } else if (llmAvailable) {
      console.log(`[WORKER] Using Gemini 2.5 Flash Direct Speech Audio Transcription!`);
      await projectService.updateProjectStatus(projectId, PROJECT_STATUSES.ANALYZING);
      await job.updateProgress(60);

      const audioResult = await captionDirector.transcribeAndDirectFromAudio(audioPath, videoMeta.duration);
      timeline = audioResult.timeline;

    } else {
      throw new Error('Neither Whisper CLI nor Gemini API key is configured.');
    }

    await job.updateProgress(90);

    // ── Step 6: Save Timeline to Database ───────────────────────
    await projectService.saveTimeline(projectId, timeline);
    await projectService.updateProjectStatus(projectId, PROJECT_STATUSES.COMPLETED);
    await job.updateProgress(100);

    console.log(`[WORKER] ✅ Project ${projectId} processing complete! (${timeline.segments.length} caption segments saved)`);

    return {
      projectId,
      segmentCount: timeline.segments.length,
      duration: videoMeta.duration,
    };

  } catch (err) {
    console.error(`[WORKER] ❌ Project ${projectId} processing failed:`, err.stack || err.message);

    await projectService.updateProjectStatus(projectId, PROJECT_STATUSES.FAILED, {
      errorMessage: err.message,
    });

    throw err;
  }
}

const worker = new Worker(QUEUE_NAMES.MEDIA_PROCESSING, processMediaJob, {
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

console.log(`[WORKER] Media processing worker started (concurrency: 2).`);

export default worker;
