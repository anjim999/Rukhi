# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Auto Captions AI (rukhi.in): a SaaS that turns uploaded video into word-timed kinetic captions (Telugu / Hindi / English and code-switched mixes), plus dubbing, B-roll, faceless reel generation, and "Rukhi Studio" (AI film generation via Vertex AI Veo/Imagen). Express + PostgreSQL backend, React + Vite frontend, deployed as a single Node process on Hostinger (Phusion Passenger).

## Commands

There is no test runner, linter, or type checker configured. CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) only runs `npm install` in `backend/` and `npm run build` in `frontend/` — a clean frontend build is the only automated check.

```bash
# Backend API (port 5000) — also runs the media worker in-process
cd backend && npm install && npm run dev

# Frontend dev server (port 5173, proxies /api, /uploads, /outputs to :5000)
cd frontend && npm install && npm run dev

# Production frontend build
cd frontend && npm run build
```

- `backend/npm run worker` exists but should not be run alongside the API: jobs are always run in-process by the API (see Caption pipeline), so with Redis up a separate worker would process each upload a second time.
- Root `package.json` is the Hostinger entry: `npm start` runs `index.js` → `backend/src/app.js`; root `npm run build` builds the frontend and **copies `frontend/dist/*` into the repo root** (uses `cp`, so not Windows-shell friendly).
- Scripts in [tests_and_samples/scripts/](tests_and_samples/scripts/) and `backend/src/scripts/` are standalone `node <file>` probes/generators that call paid GCP APIs (Veo, Imagen, Gemini). They are not a test suite. Several hardcode `backend/gcp_key.json` and a `win32-x64` ffmpeg path, so they must be run from the repo root.

### Environment

Copy `backend/.env.example` → `backend/.env`. `backend/src/config/env.js` loads every candidate it finds (`production.env`, `backend/.env`, `.env`, plus Hostinger absolute paths) with `override: true`, so later files win. Paths are resolved from `process.cwd()`, which differs between `cd backend && npm run dev` and root `npm start` — `UPLOAD_DIR`/`OUTPUT_DIR`/`gcp_key.json` lookups all depend on it.

- `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY` (aliased both ways with `GCP_API_KEY`) are the practical minimum.
- Vertex AI (Veo, Imagen, Vertex Gemini) authenticates with a service-account file `gcp_key.json` (gitignored), looked up in cwd, `backend/`, then a Hostinger path. Without it, Vertex calls return `null` and callers fall back.
- Many optional vars are read directly via `process.env` rather than `config` (e.g. `DEEPGRAM_API_KEY`, `ELEVENLABS_API_KEY`, `PINECONE_*`, `FAL_KEY`, `DEFAULT_TTS_PROVIDER`, pricing overrides in `config/pricingConfig.js`). Grep for `process.env.` before assuming `.env.example` is complete.
- Redis is optional. Tables are auto-created on boot, so no manual schema step is needed.

## Architecture

### Single-process deployment

`index.js` / `app.js` (root) → `backend/src/app.js`, which is API server, static file server for the built SPA, and media worker all in one. Order matters in `app.js`: `/uploads` and `/outputs` static mounts, then `/api/*` routes, then the SPA static dir + `*` fallback to `index.html`.

The SPA directory is the first of `cwd`, `frontend/dist`, `../frontend/dist`, `dist`, `public_html` that contains an `index.html`. **Built bundles are committed**: `frontend/dist/`, a copy at the repo root (`index.html`, `assets/`), and a stale `backend/dist/`. On production the root copy is what gets served, so a frontend change is not live until it is rebuilt and the root copy refreshed. Vite appends `Date.now()` to asset names, so each build adds new files under `assets/` rather than replacing old ones.

Deploy = push to `main`, pull on the server, `touch tmp/restart.txt` to restart Passenger. The README and Hostinger guide describe a `deploy.yml` workflow that is not in this repo; `ci.yml` is the only workflow.

### Database

`backend/src/db/pool.js` exposes `query(text, params)`. If `DATABASE_URL` is a `neon.tech` host, queries go over Neon's HTTPS `/sql` endpoint (IPv4 forced) instead of a `pg` pool — so there are **no real transactions or session state** in production; `getClient()` returns a shim. Anything else uses a normal `pg.Pool`.

`backend/src/db/initDb.js` is the source of truth for the schema: it runs `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` on every boot. Add new tables/columns there. `schema.sql` and `migrations/` are older and not executed.

`services/media/cleanupService.js` starts a daemon on boot that deletes upload/output files **and `projects` / `export_jobs` rows older than 72 hours** from whatever database is configured.

### Auth and user identity

JWT (HS256, 60 days, payload `{id, email, name}` only — no plan or role) in `Authorization: Bearer`, stored client-side as `rukhi_studio_token`. With no token, the frontend axios client sends a per-browser guest UUID in `x-user-id`.

Enforcement is thin and inconsistent, so do not assume a route is protected:

- Only `GET/PUT /api/auth/me` use `authenticateUser`. `/api/projects/*`, three `/api/broll` routes and `/api/payments` use `optionalAuth`, which never rejects. Admin, studio, studio-ledger, dubbing and support routers have no auth middleware.
- User id resolution differs per endpoint (JWT, then `body.userId` and/or `x-user-id`, sometimes falling back to the seeded dev user `00000000-0000-0000-0000-000000000001`). Studio handlers never see `req.user`, so all studio data lands on the dev user.
- Project queries are by `id` only; there are no ownership checks.
- `users.credits` is never checked or decremented anywhere. The only plan gate is `budgetGuardService.checkUserPlanAccess` for AI reels, and it reads the plan from the request (`x-user-plan` header / body, default `'PLUS'`), not the database.
- `authService` promotes any account whose email contains certain hardcoded substrings to admin on login.

### Caption pipeline (the core product)

`POST /api/projects/upload` → `projectService` creates the row → `queueService.addMediaProcessingJob`. The queue is mostly nominal: the job is added to BullMQ if Redis is up, but `processMediaDirectly` is **always** also invoked in-process via `setTimeout`. Render jobs (`addVideoRenderJob`) are a no-op stub.

`workers/mediaWorker.js` then: probe → web-optimize copy (`*_web.mp4`) → extract audio → detect speech onset → waveform peaks → `GeminiCaptionDirector.generateCaptionTimelineFromAudio` → save `captions.timeline_json` → status `completed`. Status moves through `PROJECT_STATUSES` and the editor polls `GET /projects/:id` every 3 s. Cancellation is meant to be cooperative (the worker re-checks status between steps) but currently never fires: `isProjectCancelled` calls `projectService.getProject`, which does not exist (the export is `getProjectById`), and the error is swallowed. The same pattern breaks persistence for translate / auto-emojis / generate-hooks, which call a non-existent `projectService.updateProjectTimeline` (the export is `updateTimeline`) inside empty catches. `queueService` and `mediaWorker` import each other, so check import order before relying on the BullMQ `Worker` being constructed.

The director ignores the `aspectRatio`, `presetName` and `applyEmojis` it is passed, and only `english`, `telugu` and `hindi` change the prompt — every other `targetStyle` (including `hin_eng`, `hin_tel`) gets the Telugu-Tanglish instruction. Audio over 18 s is transcribed in sequential 15 s chunks stepped by 12.5 s.

Transcription today is Gemini-on-raw-audio. Demucs, Deepgram, and local Whisper providers are imported and exist under `services/stt` and `services/media`, but the main worker path does not call them — don't assume the README's "Demucs + Deepgram" flow is what runs.

`services/llm/GeminiCaptionDirector.js` (~1500 lines) owns the hard parts: model fallback chain, chunking audio longer than ~18s, tolerant JSON extraction from model output, `_validateAndRepairTimestamps` (monotonic ordering, overlap repair, gap fill), gap re-scan for dropped speech, segment building, and `transliterateTeluguToRoman` as a deterministic fallback so native script never appears in romanized ("chatting"/`tel_eng`) styles. Product invariant: captions are verbatim — the LLM must not drop, merge, or summarize spoken words.

### Timeline contract

The timeline JSON (`segments[].words[]` with `start`/`end` seconds, `globalTheme`, `stickyHook`, `aspectRatio`) is the contract between worker, DB, editor, and exporter. Its enums (`THEME_PRESETS`, `ANIMATION_TYPES`, `PROJECT_STATUSES`, …) live in `shared/constants/timeline.js`, which exists as **two identical copies**: root `shared/` (imported by the frontend via long relative paths) and `backend/shared/` (imported by the backend). Change both together.

### Frontend editor

`pages/EditorPage.jsx` owns a single `timeline` state (wrapped in a 50-entry undo history) and passes it to `PresetSidebar`, `CanvasVideoPlayer`, and `TimelineEditor`. There is no autosave; the timeline is written to the server only by the Save button, B-roll insert, dub apply, and a pre-export save. Captions are drawn onto a `<canvas>` over a hidden `<video>` by `components/editor/utils/canvasRenderEngine.js`, driven by a `requestAnimationFrame` loop (comments mention `requestVideoFrameCallback`, but it is not used).

**Three consumers read three different parts of the timeline, and they do not agree:**

- The sidebar and timeline editor write `globalTheme.*`, `segment.styleOverride / animation / fontStyle / position / maxWordsPerLine`, and `word.highlightColor / caseFormat`.
- `canvasRenderEngine` reads only `timeline.style.{presetId, highlightColor, fontFamily, animation, positionY}`, which the editor UI does not write, and implements 3 of the 51 `ANIMATION_TYPES` (bounce, shake_rumble, glow_pulse).
- Server export (`services/media/exportService.js`) burns a plain SRT with libass `force_style` (fixed `DejaVu Sans`, bottom-centre), using only segment text/timing, `globalTheme.fontSize`, and `dubbedAudioUrl`.

So before adding a preset, animation, or style control, trace it through all three; adding the enum and UI alone will not change the preview or the export.

Export is server-side only: `POST /projects/:id/export` holds the request open for the whole FFmpeg render while the client polls `/export-progress` (an in-memory `Map`). The `/api/projects/remux` endpoint and `remuxRecordedBlob` exist but nothing calls them. Because export progress, long-form film jobs (`featureFilmService.activeJobs`), and the render cache are in-memory, they are lost on restart and assume a single process.

`src/api/axiosClient.js` unwraps `response.data` and rejects with a plain `Error(message)`, so callers get the JSON body directly and `err.response` is always undefined. Several components still read `res.data.success` or `err.response.status` and silently take the failure branch (admin dashboard, support modal, Demucs and voice-cloning modals, expired-token handling in `AuthContext`). `src/services/*.js` are thin wrappers over it. Styling is Tailwind v4 via the Vite plugin with `dark:` variants controlled by `ThemeContext` — new UI is expected to work in both light and dark mode and use `lucide-react` icons rather than emoji.

### AI provider layers

- **Gemini**: two access paths. `@google/generative-ai` with `GEMINI_API_KEY` (AI Studio), and `services/ai/vertexAiGeminiService.js` (REST against `aiplatform.googleapis.com` with a self-minted service-account token). Callers typically try Vertex first and loop over a model fallback list. Model IDs are hardcoded strings scattered across services, not centralized.
- **Video/image**: `services/ai/veoVideoService.js` and `services/studio/vertexService.js` (Veo 3.1 long-running operations, Imagen / Gemini image).
- **TTS**: `services/media/tts/ttsEngineManager.js` dispatches to a chosen engine, then falls back Google Cloud TTS → Edge-TTS.
- **Subprocesses**: FFmpeg comes from `ffmpeg-static` / `@ffmpeg-installer/ffmpeg` (falling back to `ffmpeg` on PATH); Demucs and Whisper shell out to Python and degrade gracefully when absent.

### Rukhi Studio

Routes are mounted at `/api/studio` and `/api/v1/studio`. `services/studio/directorOrchestratorService.js` is the scene pipeline: Pinecone memory lookup → `promptCompilerService` (aggregates the `departments/*` engines into a brief) → executive arbitration → continuity check → hash-based render cache → preflight → Vertex Gemini director expansion → Veo clip → audio mix → persist to `studio_scene_graphs` + `studio_production_manifests`. `productionLedgerService` records per-generation token/second/cost telemetry into `studio_generation_costs` (rates in `config/pricingConfig.js`), surfaced at `/api/studio/ledger` and the admin dashboard. Studio generation spends real GCP credit; `services/ai/budgetGuardService.js` holds the daily caps, but only the faceless-reel endpoint calls it.

Much of this pipeline is scaffolding rather than working logic, so read the callee before trusting a name:

- The seven `departments/*` engines, `executiveDirectorService`, `continuityManager` and `stylePackEngine` return static or keyword-switched templates; none calls a model. `preflightValidatorService` cannot fail, `quality_score` is a hardcoded `99.40`, and `pineconeRAGService` upserts and queries with random vectors.
- `vertexService.generateVeoVideoClip` and `compileDirectorPromptManifest` call their callees (`veoVideoService.generateVeoVideoClip`, `generateContentViaVertexAi`) with the wrong argument shapes, and `studioController` calls a `vertexService.generateAiShotList` that does not exist. Character/location image candidates (`gemini-2.5-flash-image`) are the part that makes real calls.
- `audioOrchestratorService` synthesizes TTS and discards it; there is no mixing step.
- `veoVideoService` always requests 6-second clips from `veo-3.1-lite-generate-001` (then `veo-3.1-generate-001`) regardless of the duration argument or `VEO_MODEL`.
- `featureFilmService` imports `scripts/produceFeatureFilm.js`, whose top level runs at server boot and which uses a Windows-only ffmpeg path and shared, un-namespaced temp files in `tmp/feature_film`. The other scripts in `backend/src/scripts/` auto-run on import and must never be imported.

The live faceless-reel path is separate: `POST /api/broll/generate-faceless` → `services/ai/aiReelService.js` (storyboard → per-scene Veo with last-frame continuation → Chirp TTS → FFmpeg concat). `videoGeneratorService.js` and `generateFacelessVideoProject` in `legacyVideoGeneratorService.js` are dead; only `generateScriptForPrompt` from the legacy file is used.

### Film production pipeline (`backend/src/film/`)

A standalone CLI for long-form films, deliberately independent of the server, the database and the Studio services above: `node backend/src/film/cli.js help` (or `npm run film -- help` in `backend/`). It resolves paths from its own location, so it runs from any directory.

Stages, each resumable: `new` (copy script) → `breakdown` (script → bible + scenes, by line ranges) → `shots` (per-scene shot list of 4/6/8 s shots) → `refs` + `pick` (lock one reference image per character and location) → `keyframes` (a still per shot, conditioned on the locked references and the previous shot) → `clips` (Veo image-to-video from the keyframe) → `assemble` (normalise, concat, optional ducked music from `music/`).

- Commands outside that chain: `looks` (redraw locked characters in this episode's outfit), `views` (reference-sheet views such as closeup/profile, which `expression` draws on), `graphics` (free local render of `kind: 'graphic'` shots), and the free bookkeeping commands `status`, `estimate`, `review`, `cap <usd>` and `auth` (checks the GCP key without spending). `film help` is the authoritative usage text.
- All state is JSON on disk under `productions/<slug>/` (gitignored): `film.json`, `scenes/S01.json`, `ledger.json`, plus `refs/`, `shots/`, `out/` and a generated `review.html`. Nothing is held in memory between runs.
- Every paid call goes through `ledger.assertBudget` first and stops at `film.json → budget.capUsd`. Prices in `ledger.js` are estimates, overridable per film.
- A Veo operation name is saved before polling, so an interrupted run resumes the same job rather than paying for a new one. The video model is Lite only; do not add a fallback to the full model.
- Keyframes and clips keep every take; `select` chooses which one a shot uses.
- Veo cannot hold a voice across clips, so dialogue is re-voiced: `voices` auditions Google Chirp 3 HD voices per character, `voice` locks one, and `dub` replaces each dialogue clip's audio with that voice, time-fitted (speed 0.88–1.25×) to where the original clip had sound, over a room tone (or `productions/<slug>/ambience/<locationId>.mp3` if present). `assemble` uses the dubbed file when one exists. Shots without dialogue keep Veo's audio.
- Shots can also be authored by hand in a plan script (`productions/*.plan.mjs`) instead of `breakdown`/`shots`; re-running it with `--reset-shots` re-plans while keeping takes whose shot id and label still match. Plan-only shot fields: `kind: 'graphic'` (phone screens and title cards rendered locally by `graphics.js` through headless Chrome, for exact text), `trimSec`, `performance` (acting beats, placed early in the Veo prompt), `expression` (which of a character's own expression views to attach to the still), `continuity: false`.
- `clips --takes N` renders N takes of each dialogue shot; only takes made from the currently selected still count. `productions/tools/judge-takes.mjs` scores takes with a model and selects one, but its verdicts vary between runs, so look at the frame sheets it writes before trusting a close call.
- Veo filters output, or rejects the input still, when a face reads as a photograph of a real person or as a minor, most often on speaking shots. This is per still and partly random: retry, reuse a still that passed (`tools/reuse-keyframe.mjs`), or redraw the character as clearly adult CG.
- A series bible passed with `new --bible` is authoritative for the breakdown (fixed character IDs, designs, voices); `new --from <slug>` carries approved designs and reference images into a later episode. Cast-level scripts (`productions/*-cast.mjs`, `productions/tools/restyle-cast.mjs`, `redesign-from-description.mjs`) take source photos from the repo-root `characters/` folder. Characters or locations with a locked `ref` are never redescribed by a re-run.

### Payments

Cashfree v3 (`services/payment/cashfreeService.js`), router mounted at both `/api/payment` and `/api/payments`. Plans live in `SUBSCRIPTION_PLANS` in `controllers/paymentController.js` (`free`, `basic` ₹79, `starter`/`plus` ₹199, `pro` ₹299, `dubbing_studio` ₹399); the display copy in `components/pricing/PricingModal.jsx` is separate and does not match the credit amounts.

Only order creation talks to Cashfree. `verifyPayment` does not check the order — it sets `users.plan` and adds credits for the `userId` in the request body — and the webhook handler only logs. The `subscriptions` and `payments` tables are created but never written, so there is no expiry or renewal.

## Docs worth knowing about

[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) is the long-form spec, [PROJECT_SUMMARY_FOR_AI.md](PROJECT_SUMMARY_FOR_AI.md) is an older AI-oriented summary (it describes Demucs in the worker path, which no longer runs, and a single `gemini-3.5-flash` model, whereas the code mixes 1.5 / 2.5 / 3.x IDs in fallback chains), and [docs/fixes/](docs/fixes/) holds root-cause write-ups for past production incidents (Hostinger/Passenger routing, Vertex auth, export). They are useful history but drift from the code in places (model versions, pricing tiers, the Demucs/Deepgram flow, absolute `file:///home/anji/...` links) — verify against source.
