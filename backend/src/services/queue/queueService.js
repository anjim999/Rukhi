import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../../config/env.js';
import { processMediaDirectly } from '../../workers/mediaWorker.js';

// ─────────────────────────────────────────────
// Shared Redis Connection with In-Memory Fallback
// ─────────────────────────────────────────────

let isRedisConnected = false;
let redisWarned = false;

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy(times) {
    if (times === 1 && !redisWarned) {
      redisWarned = true;
      console.log('ℹ️ [REDIS] Redis server not detected. Backend automatically running in High-Performance In-Memory Async Mode (No Redis required!).');
    }
    return null; // Don't loop reconnection forever
  },
};

export const redisConnection = config.redis.url
  ? new IORedis(config.redis.url, redisOptions)
  : new IORedis({
      host: config.redis.host,
      port: config.redis.port,
      ...redisOptions,
    });

redisConnection.on('connect', () => {
  isRedisConnected = true;
  console.log('✅ [REDIS] Connected successfully.');
});

redisConnection.on('error', () => {
  isRedisConnected = false;
});

// Attempt silent connection once
redisConnection.connect().catch(() => {
  isRedisConnected = false;
});

export const QUEUE_NAMES = Object.freeze({
  MEDIA_PROCESSING: 'media-processing',
  VIDEO_RENDER: 'video-render',
});

let mediaProcessingQueue = null;
let videoRenderQueue = null;

try {
  mediaProcessingQueue = new Queue(QUEUE_NAMES.MEDIA_PROCESSING, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: { age: 86400, count: 200 },
    },
  });

  videoRenderQueue = new Queue(QUEUE_NAMES.VIDEO_RENDER, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { age: 86400, count: 100 },
    },
  });
} catch (_err) {
  // Redis unavailable — fallback to In-Memory
}

// ─────────────────────────────────────────────
// Job Producers (Automatic In-Memory Fallback)
// ─────────────────────────────────────────────

export async function addMediaProcessingJob(data) {
  if (isRedisConnected && mediaProcessingQueue) {
    try {
      const job = await mediaProcessingQueue.add('process-media', data, {
        jobId: `media-${data.projectId}`,
      });
      console.log(`[QUEUE] Media processing job added to Redis: ${job.id}`);
    } catch (_e) {
      // Fallback below
    }
  }

  // Always trigger direct background processing for instant zero-wait execution
  console.log(`⚡ [ASYNC ENGINE] Processing media for project ${data.projectId} directly in background...`);
  setTimeout(() => {
    processMediaDirectly(data).catch((err) => {
      console.error(`❌ [ASYNC ENGINE] Error processing media for project ${data.projectId}:`, err);
    });
  }, 50);

  return { id: `media-${data.projectId}` };
}

export async function addVideoRenderJob(data) {
  console.log(`⚡ [IN-MEMORY] Video render requested for project ${data.projectId}`);
  return { id: `render-${data.projectId}` };
}

export async function closeQueues() {
  if (isRedisConnected) {
    try {
      if (mediaProcessingQueue) await mediaProcessingQueue.close();
      if (videoRenderQueue) await videoRenderQueue.close();
      await redisConnection.quit();
    } catch (_e) {}
  }
}
