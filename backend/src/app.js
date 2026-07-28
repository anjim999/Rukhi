import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { closePool } from './db/pool.js';
import { initDb } from './db/initDb.js';
import { closeQueues } from './services/queue/queueService.js';
import projectRoutes from './routes/project.routes.js';
import authRoutes from './routes/auth.routes.js';
import dubbingRoutes from './routes/dubbing.routes.js';
import brollRoutes from './routes/broll.routes.js';
import { initAutoCleanupDaemon } from './services/media/cleanupService.js';

/**
 * Express Application
 */

const app = express();

// Middleware Stack — Reflect request origin automatically for 100% CORS preflight & cross-origin header pass
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-user-id'],
}));
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

const staticUploadDirs = Array.from(new Set([
  config.uploadDir,
  path.resolve(process.cwd(), 'uploads'),
  path.resolve(process.cwd(), 'backend/uploads'),
]));

const staticOutputDirs = Array.from(new Set([
  config.outputDir,
  path.resolve(process.cwd(), 'outputs'),
  path.resolve(process.cwd(), 'backend/outputs'),
]));

staticUploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  app.use('/uploads', cors(), express.static(dir, {
    maxAge: '7d',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Accept-Ranges', 'bytes');
    },
  }));
});

staticOutputDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  app.use('/outputs', cors(), express.static(dir, {
    maxAge: '7d',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Accept-Ranges', 'bytes');
    },
  }));
});

// Root Health Probes (Render / Load Balancer Pings)
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'Auto Captions API Server is Running!' });
});
app.head('/', (_req, res) => {
  res.status(200).end();
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptime: Math.round(process.uptime()),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/dubbing', dubbingRoutes);
app.use('/api/broll', brollRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Server Start & DB Auto-Init
const server = app.listen(config.port, async () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       AUTO CAPTIONS — API SERVER             ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Environment : ${config.nodeEnv.padEnd(29)}║`);
  console.log(`║  Port        : ${String(config.port).padEnd(29)}║`);
  console.log(`║  Health      : http://localhost:${config.port}/api/health   ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // Auto-init DB tables
  await initDb();

  // Start 3-Day File Auto-Cleanup Daemon
  initAutoCleanupDaemon();
});

// Graceful Shutdown
async function gracefulShutdown(signal) {
  console.log(`\n[SERVER] Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('[SERVER] HTTP server closed.');

    try {
      await closeQueues();
      await closePool();
      console.log('[SERVER] All resources released. Exiting.');
      process.exit(0);
    } catch (err) {
      console.error('[SERVER] Error during shutdown:', err.message);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('[SERVER] Forced exit after timeout.');
    process.exit(1);
  }, 15000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

export default app;
