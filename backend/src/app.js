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
import supportRoutes from './routes/support.routes.js';
import adminRoutes from './routes/admin.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import { initAutoCleanupDaemon } from './services/media/cleanupService.js';
import './workers/mediaWorker.js';


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

const persistentBase = '/home/u209580425/persistent_storage';

const staticUploadDirs = Array.from(new Set([
  config.uploadDir,
  path.join(persistentBase, 'uploads'),
  path.resolve(process.cwd(), 'uploads'),
  path.resolve(process.cwd(), 'backend/uploads'),
]));

const staticOutputDirs = Array.from(new Set([
  config.outputDir,
  path.join(persistentBase, 'outputs'),
  path.resolve(process.cwd(), 'outputs'),
  path.resolve(process.cwd(), 'backend/outputs'),
]));


staticUploadDirs.forEach((dir) => {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (_e) {}

  if (fs.existsSync(dir)) {
    app.use('/uploads', cors(), express.static(dir, {
      maxAge: '7d',
      setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Accept-Ranges', 'bytes');
      },
    }));
  }
});

staticOutputDirs.forEach((dir) => {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (_e) {}

  if (fs.existsSync(dir)) {
    app.use('/outputs', cors(), express.static(dir, {
      maxAge: '7d',
      setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Accept-Ranges', 'bytes');
      },
    }));
  }
});

// Mount React Frontend Static Bundle & SPA Fallback (Prevents Hostinger 503s)
const staticFrontendDirs = [
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), 'dist'),
  path.resolve(process.cwd(), 'public_html'),
];

let frontendDirFound = null;
for (const dir of staticFrontendDirs) {
  if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html'))) {
    frontendDirFound = dir;
    app.use(express.static(dir));
    break;
  }
}

if (frontendDirFound) {
  console.log(`[SERVER] Serving React Frontend from: ${frontendDirFound}`);
}


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
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment', paymentRoutes);

// React SPA Route Fallback (Serves index.html for frontend routes like /dashboard, /editor, /login)
if (frontendDirFound) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/outputs')) {
      return next();
    }
    res.sendFile(path.join(frontendDirFound, 'index.html'));
  });
}

// Error Handling
app.use(notFoundHandler);

app.use(errorHandler);

// Server Start & Non-Blocking Async DB Init
const listenTarget = process.env.PORT || config.port;
const server = app.listen(listenTarget, () => {





  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       AUTO CAPTIONS — API SERVER             ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Environment : ${config.nodeEnv.padEnd(29)}║`);
  console.log(`║  Target      : ${String(listenTarget).padEnd(29)}║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // Non-blocking async background initialization
  initDb().catch((err) => console.error('[DB INIT ERROR]:', err.message));

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
