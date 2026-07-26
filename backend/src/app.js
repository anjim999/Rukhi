import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { closePool } from './db/pool.js';
import { initDb } from './db/initDb.js';
import { closeQueues } from './services/queue/queueService.js';
import projectRoutes from './routes/project.routes.js';
import authRoutes from './routes/auth.routes.js';

/**
 * Express Application
 */

const app = express();

// Middleware Stack
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) return callback(null, true);

    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'https://rocky-captions.vercel.app',
      ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((s) => s.trim()) : []),
    ];

    try {
      const hostname = new URL(origin).hostname;
      if (allowed.includes(origin) || hostname.endsWith('.vercel.app')) {
        return callback(null, true);
      }
    } catch (_e) {
      // Ignore URL parsing errors
    }

    // Dynamic fallback to reflect origin and prevent CORS block
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}
app.use('/uploads', cors(), (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Accept-Ranges', 'bytes');
  express.static(config.uploadDir, {
    maxAge: '7d',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Accept-Ranges', 'bytes');
    },
  })(req, res, next);
});

app.use('/outputs', cors(), (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Accept-Ranges', 'bytes');
  express.static(config.outputDir, {
    maxAge: '7d',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Accept-Ranges', 'bytes');
    },
  })(req, res, next);
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
