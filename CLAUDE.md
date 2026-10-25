# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Auto Captions AI / "Rukhi" (rukhi.in): a SaaS for kinetic word-by-word captions on short-form video, plus dubbing, B-roll, AI video generation (Vertex AI Veo / Imagen / Gemini) and a multi-department "Rukhi Studio" film pipeline. A plain-JavaScript monorepo with ES modules throughout (`"type": "module"`): an Express backend in `backend/` and a React 18 + Vite + Tailwind v4 frontend in `frontend/`.

`README.md`, `PROJECT_OVERVIEW.md` and `docs/fixes/*.md` hold the long-form architecture notes and fix history. Some details in them are stale; for example, the README names `.github/workflows/deploy.yml`, but only `ci.yml` exists.

## Commands

```bash
# Backend API (port 5000 by default); this also starts the media worker in-process
cd backend && npm install && npm run dev

# Standalone BullMQ worker (optional, needs Redis)
cd backend && npm run worker

# Frontend dev server on :5173; proxies /api, /uploads and /outputs to localhost:5000
cd frontend && npm install && npm run dev

# Production frontend build (this is what CI checks)
cd frontend && npm run build

# Root-level production flow used on Hostinger
npm run build   # builds frontend and copies dist/* into the repo root (index.html, assets/)
npm start       # node index.js -> imports backend/src/app.js
```

There is no test runner, linter or formatter. CI (`.github/workflows/ci.yml`, on push/PR to `main`) only installs backend deps and runs `vite build` for the frontend, so a successful frontend build is the main verification. `tests_and_samples/scripts/*.js` are standalone manual scripts that call live external APIs (Veo, Vertex, Deepgram and others), e.g. `node tests_and_samples/scripts/test_vertex.js`. They need real credentials, and they are not a test suite.

## Architecture

### Single process serves everything
`backend/src/app.js` is the only server. It mounts the API routes under `/api/*`, serves `/uploads` and `/outputs` statically from several candidate dirs (including the Hostinger path `/home/u209580425/persistent_storage`), then serves the built React SPA from the first directory with an `index.html` (repo root → `frontend/dist` → …), with an SPA fallback. Phusion Passenger starts it through the root `index.js`/`app.js` → `backend/src/app.js`. The root `index.html` and `assets/` are **build output** copied from `frontend/dist` and committed, as is `frontend/dist/` itself (whitelisted in `.gitignore`). Don't hand-edit them. Vite appends `Date.now()` to asset names, so every build produces new files.

Route mounts to note: `/api/payments` and `/api/payment` both map to the same router; `/api/studio` and `/api/v1/studio` both map to the studio router.

### Config
`backend/src/config/env.js` loads every `.env`/`production.env` it finds from a list of local and Hostinger paths, with `override: true` (so later files win). `GEMINI_API_KEY` and `GCP_API_KEY` are aliased to each other. Vertex AI services authenticate with a service-account file `backend/gcp_key.json` (gitignored). On the frontend, `src/api/axiosClient.js` uses `VITE_API_BASE_URL` (default `/api`). It sends the JWT from `localStorage.rukhi_studio_token` or, for guests, an `x-user-id` header with a generated guest UUID. It also unwraps `response.data`, so service functions receive the body directly.

### Database
PostgreSQL, usually Neon. `db/pool.js` detects Neon URLs and uses Neon's HTTPS query path, falling back to a `pg` Pool for other databases. The schema is created and evolved **at startup** by `db/initDb.js` with `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Add schema changes there; `schema.sql` and `migrations/` are reference only, and no migration runner exists.

### Caption pipeline (core flow)
1. `POST /api/projects/upload` → `projectController` → `projectService` creates the project row → `queueService.addMediaProcessingJob()`.
2. `services/queue/queueService.js` adds a BullMQ job if Redis is reachable, **and always** also runs `processMediaDirectly()` in-process with `setTimeout`. Redis is optional; without it, the app runs in "in-memory async mode". `app.js` also imports `workers/mediaWorker.js`, so the worker lives in the API process.
3. `workers/mediaWorker.js` runs `probeVideo` → `webOptimizeVideo` → `extractAudio` → speech-onset and waveform detection → `GeminiCaptionDirector.generateCaptionTimelineFromAudio()` → `saveTimeline`. It moves through `PROJECT_STATUSES` and checks `isProjectCancelled()` between steps. Demucs vocal separation (Python `htdemucs`) and a raw-audio STT retry handle music-heavy audio.
4. `services/llm/GeminiCaptionDirector.js` builds the timeline. It has strict verbatim word-preservation prompts, falls back to the raw STT words if the LLM drops more than 30% of them, and runs `_validateAndRepairTimestamps()` (monotonic order, overlap and gap repair, clamping). `utils/teluguTransliteration.js` is the deterministic Telugu→Roman fallback for the `chatting`/`tel_eng` script mode.
5. The frontend `EditorPage` has three columns: `PresetSidebar`, `CanvasVideoPlayer` (HTML5 canvas renderer using `requestVideoFrameCallback`; drawing logic lives in `components/editor/utils/canvasRenderEngine.js`) and `TimelineEditor`.

### Shared timeline constants: two copies
`shared/constants/timeline.js` (imported by the frontend) and `backend/shared/constants/timeline.js` (imported by the backend) are identical copies of `PROJECT_STATUSES`, `THEME_PRESETS`, `ANIMATION_TYPES` and the CaptionTimeline typedefs. **Change both together.** The backend can't import the root copy, because only `backend/` is deployed with its own `node_modules`.

### Provider abstraction layers (backend/src/services)
- `stt/`: `STTProvider` base class with Deepgram and local Whisper implementations; `speechRecognitionService.js` handles mic transcription through Gemini.
- `llm/`: `LLMProvider` base class with `GeminiCaptionDirector`.
- `media/tts/ttsEngineManager.js`: one `synthesizeSpeech()` dispatcher with a fallback chain across Edge, Google, Indic, XTTS, F5/Bark and ElevenLabs (`DEFAULT_TTS_PROVIDER`).
- `media/ffmpegService.js`: all FFmpeg/ffprobe work (bundled binaries from `ffmpeg-static`/`ffprobe-static`). `exportService.js` does the 20 Mbps master export.
- `ai/`: Vertex AI Gemini, Veo video, scene director, Pinecone RAG, and `budgetGuardService`.
- `studio/`: the Rukhi Studio film pipeline. `directorOrchestratorService` coordinates the `departments/*Engine.js` modules (story, cinematography, lighting, sound, editing, performance, realism) together with character, location and continuity services, a preflight validator, a prompt compiler and the episode stitcher. `productionLedgerService` + `config/pricingConfig.js` record per-user AI cost (USD/INR) in `studio_generation_costs`. `backend/src/scripts/produce*.js` are CLI runners for this pipeline.
- `payment/cashfreeService.js`: Cashfree v3 checkout plus webhook `/api/payment/cashfree-webhook`, which activates subscription plans on `users.plan`/`credits`.
- `media/cleanupService.js`: a daemon started at boot that deletes media files after about 3 days.

### Auth
JWT (`middleware/auth.js`): `authenticateUser` requires a Bearer token; `optionalAuth` sets `req.user` or `null`. Many routes also accept the guest `x-user-id` header. Errors go through `utils/AppError.js` and `middleware/errorHandler.js`.

## Deployment

Pushing to `main` deploys to Hostinger Business hosting (Node.js through Phusion Passenger); see `HOSTINGER_DEPLOYMENT_GUIDE.md`. To restart Passenger, run `touch tmp/restart.txt`. The root `.htaccess` must contain **only** the Passenger directives. Express does all routing, and adding rewrite rules broke production before. `app.js` exposes `POST /api/deploy-webhook`, which runs `git reset --hard origin/main` on the server.
