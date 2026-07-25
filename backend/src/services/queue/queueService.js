import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../../config/env.js';

// ─────────────────────────────────────────────
// Shared Redis Connection
// ─────────────────────────────────────────────

/**
 * Shared IORedis connection for all BullMQ queues.
 * Supports both REDIS_URL (e.g. Upstash, Redis Cloud) and host/port.
 */
const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    if (times === 1) {
      console.warn('[REDIS] Cannot connect to Redis. Ensure Redis is running locally or REDIS_URL is set in .env');
    }
    return Math.min(times * 1000, 5000);
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
  console.log('[REDIS] Connected successfully.');
});

redisConnection.on('error', (err) => {
  // Suppress repetitive reconnection errors
});

// ─────────────────────────────────────────────
// Queue Names
// ─────────────────────────────────────────────

export const QUEUE_NAMES = Object.freeze({
  MEDIA_PROCESSING: 'media-processing',
  VIDEO_RENDER: 'video-render',
});

// ─────────────────────────────────────────────
// Queue Instances
// ─────────────────────────────────────────────

export const mediaProcessingQueue = new Queue(QUEUE_NAMES.MEDIA_PROCESSING, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { age: 86400, count: 200 },
    removeOnFail: { age: 604800 },
  },
});

export const videoRenderQueue = new Queue(QUEUE_NAMES.VIDEO_RENDER, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 86400, count: 100 },
    removeOnFail: { age: 604800 },
  },
});

// ─────────────────────────────────────────────
// Job Producers
// ─────────────────────────────────────────────

export async function addMediaProcessingJob(data) {
  const job = await mediaProcessingQueue.add('process-media', data, {
    jobId: `media-${data.projectId}`,
  });
  console.log(`[QUEUE] Media processing job added: ${job.id}`);
  return job;
}

export async function addVideoRenderJob(data) {
  const job = await videoRenderQueue.add('render-video', data, {
    jobId: `render-${data.projectId}-${data.exportJobId}`,
  });
  console.log(`[QUEUE] Video render job added: ${job.id}`);
  return job;
}

export async function closeQueues() {
  console.log('[QUEUE] Closing queues...');
  await mediaProcessingQueue.close();
  await videoRenderQueue.close();
  await redisConnection.quit();
  console.log('[QUEUE] All queues closed.');
}
