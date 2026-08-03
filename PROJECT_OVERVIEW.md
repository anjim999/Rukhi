# Auto Captions AI — Complete Project Overview & Technical Architecture Specification

> **Auto Captions AI (rukhi.in)** is a production-grade, Submagic & Opus Clip-style SaaS web platform and media rendering engine. It automates high-converting, viral kinetic caption generation, multi-lingual transcription, video editing, voice dubbing, and social media content creation for Instagram Reels, YouTube Shorts, and TikTok.

---

## 📐 Table of Contents

1. [Executive Summary & Product Vision](#1-executive-summary--product-vision)
2. [End-to-End System Architecture](#2-end-to-end-system-architecture)
3. [Deep-Dive: Video-Audio-Caption Sync Engine](#3-deep-dive-video-audio-caption-sync-engine)
4. [Backend Architecture & Data Pipelines](#4-backend-architecture--data-pipelines)
5. [Frontend & HTML5 Canvas Render Engine](#5-frontend--html5-canvas-render-engine)
6. [Database Schema & State Models](#6-database-schema--state-models)
7. [Cashfree v3 Production Payment Gateway & Monetization Engine](#7-cashfree-v3-production-payment-gateway--monetization-engine)
8. [API Endpoints & Contracts](#8-api-endpoints--contracts)
9. [Complete File Directory & Module Map](#9-complete-file-directory--module-map)
10. [Development Setup & Hostinger Production Deployment](#10-development-setup--hostinger-production-deployment)
11. [Verbatim 1:1 Word Preservation Engine](#11-verbatim-11-word-preservation-engine)
12. [Fail-Safe Local Telglish Transliteration Engine](#12-fail-safe-local-telglish-transliteration-engine)
13. [Hostinger Container Media Pipeline & MPEG-4 Fast Remuxing](#13-hostinger-container-media-pipeline--mpeg-4-fast-remuxing)
14. [Meta AI Demucs Single-Threaded Isolation Engine](#14-meta-ai-demucs-single-threaded-isolation-engine)
15. [Single API Key Unified AI Architecture & Billing Breakdown](#15-single-api-key-unified-ai-architecture--billing-breakdown)
16. [Comprehensive Root Cause Analysis & Fix History](#16-comprehensive-root-cause-analysis--fix-history)

---

## 1. Executive Summary & Product Vision

Auto Captions AI solves the core problem content creators face: **manually writing, timing, and styling subtitles takes hours**. 

Auto Captions AI automates this entire pipeline in seconds:
- **Instant AI Transcription & Script Formatting**: Transcribes raw speech in native Telugu, Hindi, English, Teluglish (Telugu in Roman script), Hinglish, and code-switched audio using Meta Demucs vocal separator, Deepgram Nova-2, and Gemini 2.5 Flash.
- **Submagic Kinetic Subtitles**: Dynamically styles words into animated blocks with active-word solid box highlights, neon glow effects, emojis, and sound effects.
- **AI B-Roll Engine & AI Visual Overlays**: Contextual keyword extraction via Gemini 2.5 Flash for automated AI scene image generation (Pollinations.ai / Fal.ai) and FFmpeg 3D camera motion overlay clip placement on the timeline.
- **Multilingual Voice Dubbing Studio**: AI speech translation and neural voice synthesis in Telugu, Hindi, English, Spanish, French, and other languages.
- **Faceless Short-Form Video Generator**: Topic-to-video workflow generating scripts, AI scene visuals, audio narration, and synchronized captions automatically.
- **Smart Aspect-Ratio Auto-Reframer**: Dynamic subject tracking for reframing 16:9 widescreen videos into 9:16 vertical reels.
- **Broadcast-Grade Ripple Sync & Nudge Engine**: Auto-shifts downstream captions upon timestamp edits, with quick 1-click nudge controls (`-0.5s`, `-0.1s`, `+0.1s`, `+0.5s`) and global offset delay tool.
- **70+ Multilingual Typography & Visual Font Studio Modal**: Full Google Fonts suite for English, Hindi (Devanagari script), and Telugu script with live rendered script previews and language category filtering.
- **Un-Clipped React Portal Dropdowns (`CustomFontSelect.jsx`)**: Floating `rounded-2xl` popovers rendered on `document.body` with built-in font search bar.
- **Millisecond Audio Synchronization**: Enforces 100% frame-accurate word-level alignment matching actual audio playback.
- **Bank-Grade Cashfree v3 Production Payment Gateway**: Monetization architecture featuring 5 flexible subscription tiers (**Free ₹0**, **Basic ₹79**, **Plus 30s Reels ₹199**, **Pro 60s Reels ₹299**, and **Dubbing Studio ₹399**) with Cashfree Popup Checkout modal (`redirectTarget: '_modal'`), real-time webhook listeners (`/api/payment/cashfree-webhook`), and automatic PostgreSQL subscription activation.
- **Legal Compliance Suite**: Privacy Policy, Terms of Service with Anti-Deepfake/Zero-Abuse policies, Refund Policy (7-Day Money Back Guarantee), and Contact Us pages with live embedded interactive components.
- **Admin Oversight Dashboard & Analytics**: System monitoring, user metrics, subscription logs, and admin management endpoints.
- **Integrated Support Desk & Mailer**: Embedded support modal, issue ticket tracking, and direct email delivery using Hostinger SMTP.
- **AI Social Copywriter**: Generates viral Instagram captions, hashtags, and YouTube Shorts titles directly from the video transcript.


---

## 2. End-to-End System Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │           USER / WEB CLIENT                  │
                               │  (React 18 + Vite + Cashfree v3 Popup SDK)   │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                           HTTP REST / Multipart API
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │         EXPRESS API BACKEND SERVER           │
                               │   (Auth, Payments, Projects, Controller)     │
                               └──────────────┬────────────────┬──────────────┘
                                              │                │
                                      SQL Queries       Job Producer
                                              │                │
                                              ▼                ▼
                               ┌──────────────────┐    ┌──────────────────────┐
                               │  Neon PostgreSql │    │  Redis + BullMQ Queue│
                               └──────────────────┘    └──────────┬───────────┘
                                                                  │
                                                          Job Consumption
                                                                  │
                                                                  ▼
                                                       ┌──────────────────────┐
                                                       │ BACKGROUND WORKER    │
                                                       └──────────┬───────────┘
                                                                  │
                                               ┌──────────────────┴──────────────────┐
                                               ▼                                     ▼
                                      [ FFmpeg Service ]                  [ Gemini 2.5 Flash ]
                                  (Audio Extract & Probe)                (STT + Sync Repair)
```

---

## 3. Deep-Dive: Video-Audio-Caption Sync Engine

Caption-audio misalignments ruin viewer retention. Auto Captions AI includes a custom **Validation & Timestamp Repair Engine** built inside `GeminiCaptionDirector.js`.

### The 4 Pillars of the Sync Engine

#### 1. Deterministic Prompt Engineering & Temperature Control
- **Temperature Setting**: Reduced from `0.2` to `0.1` to eliminate hallucinated timing drift.
- **Prompt Constraints**:
  - Requires 2-decimal-place second timestamps (`start_sec`, `end_sec`).
  - Forces first word alignment to speech onset (not arbitrary `0.00`).
  - Enforces strictly monotonic order: `word[n].start < word[n].end` and `word[n].end <= word[n+1].start`.

#### 2. Microsecond Timestamp Repair (`_validateAndRepairTimestamps()`)
Runs automatically on raw model output before saving:
- **Overlap Elimination**: If `word[n].start < word[n-1].end`, pulls `word[n-1].end` back to match `word[n].start`.
- **Micro-Gap Filling**: Automatically closes silence gaps (`<= 0.25s`) between consecutive words, preventing captions from flashing off mid-phrase.
- **Clamping**: Restricts all timestamps within `[0, videoDuration]`.

```js
// Core Sync Repair Pseudocode
_validateAndRepairTimestamps(wordObjects, videoDuration) {
  for (let i = 0; i < wordObjects.length; i++) {
    const current = wordObjects[i];
    if (i > 0) {
      const prev = wordObjects[i - 1];
      if (current.start < prev.end) prev.end = current.start; // Fix overlap
      if (current.start - prev.end <= 0.25) prev.end = current.start; // Fill gap
    }
  }
}
```

#### 3. Seamless Segment Chunking & Canvas Tolerance Buffer
- Groups words into chunks of 3 while extending segment end times to eliminate visual gaps between adjacent chunks.
- Adds a `0.05s` tolerance buffer in `CanvasVideoPlayer.jsx` so frame-rendered captions transition cleanly without micro-flickers.

---

## 4. Backend Architecture & Data Pipelines

### Tech Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL (`pg` connection pool on Neon Cloud)
- **Background Queue**: BullMQ + Redis
- **Payment Engine**: Cashfree Payments REST API v3 (`2023-08-01`)
- **AI Processing**: `@google/generative-ai` (Gemini 2.5 Flash)
- **Media Engine**: FFmpeg + `ffprobe-static` + `ffmpeg-static`

### Pipeline Steps for Video Processing

1. **Upload**: User uploads video (`POST /api/projects/upload`). Multer validates file type and saves raw video to `backend/uploads/`.
2. **Job Enqueue**: Express creates a database record (`status = 'processing'`) and pushes a job to BullMQ queue `media-processing`.
3. **Audio Extraction**: `mediaWorker.js` picks up the job and invokes `ffmpegService.extractAudio()`, generating a 16kHz mono WAV file in `/tmp`.
4. **AI Transcription**: `GeminiCaptionDirector.transcribeAndDirectFromAudio()` sends the audio file to Gemini 2.5 Flash with the target script style (`auto`, `chatting`, `telugu`, `hindi`, `english`).
5. **Timeline Construction**: Gemini's response passes through `_validateAndRepairTimestamps()`, constructing kinetic caption segments with presets, animations, emojis, and sound effects.
6. **DB Commit**: The resulting timeline JSON and fullText transcript are saved in PostgreSQL (`status = 'completed'`).

---

## 5. Frontend & HTML5 Canvas Render Engine

### Tech Stack
- **Framework**: React 18.3 + Vite
- **Styling**: Vanilla CSS + Tailwind CSS
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Payment Modal**: Cashfree JS SDK v3 (`window.Cashfree`)

### Broadcast 60FPS Hardware-Synced Canvas Player (`CanvasVideoPlayer.jsx`)
- Uses `requestVideoFrameCallback` (falling back to `requestAnimationFrame`) to synchronize canvas renders with the browser's video decoder hardware.
- Throttles UI slider updates to `100ms` so React re-renders don't thrash playback performance.

---

## 6. Database Schema & State Models

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user',
  plan VARCHAR(50) DEFAULT 'free',
  credits INTEGER DEFAULT 3,
  reset_token VARCHAR(255),
  reset_token_expiry TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  gateway VARCHAR(20) NOT NULL,
  gateway_order_id VARCHAR(255),
  amount NUMERIC(10, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  gateway VARCHAR(20) NOT NULL,
  payment_id VARCHAR(255),
  order_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. Cashfree v3 Production Payment Gateway & Monetization Engine

### Production Configuration
- **App ID**: `1353108b98b98b751ede89142678013531`
- **Environment**: `PRODUCTION` (`https://api.cashfree.com/pg`)
- **API Version**: `2023-08-01`
- **Webhook Endpoint**: `https://rukhi.in/api/payment/cashfree-webhook`
- **Subscribed Events**: `success payment`, `failed payment`, `payment verification update`, `user dropped payment`.

### Flow of Execution:
1. **Order Creation (`POST /api/payments/create-order`)**:
   - Backend calls `createCashfreeOrder()` in `cashfreeService.js`.
   - Sends REST API payload to Cashfree `/pg/orders`.
   - Returns Cashfree `paymentSessionId` to frontend.
2. **Popup Modal Execution (`PricingModal.jsx`)**:
   - Frontend invokes `window.Cashfree({ mode: 'PRODUCTION' }).checkout({ paymentSessionId, redirectTarget: '_modal' })`.
   - Seamless popover modal opens for UPI / Cards / NetBanking.
3. **Verification & Subscription Activation (`POST /api/payments/verify`)**:
   - Updates `users` table: `UPDATE users SET plan = $1, credits = $2 WHERE id = $3`.
   - Logs completed transaction in `payments` and `subscriptions` table.
   - Refreshes global `AuthContext` state so UI immediately displays **"Current Active Plan"**.

---

## 8. API Endpoints & Contracts

### Auth Routes (`/api/auth`)
- `POST /api/auth/register` — Body: `{ name, email, password }`
- `POST /api/auth/login` — Body: `{ email, password }` $\to$ Returns JWT token & user object.
- `GET /api/auth/me` — Header: `Authorization: Bearer <token>` $\to$ Returns user profile with `plan` and `credits`.

### Payment Routes (`/api/payments` & `/api/payment`)
- `POST /api/payments/create-order` — Body: `{ planId }` $\to$ Returns Cashfree `paymentSessionId`.
- `POST /api/payments/verify` — Body: `{ orderId, planId }` $\to$ Activates plan & returns updated credits.
- `POST /api/payment/cashfree-webhook` — Cashfree real-time webhook listener.

### Project & Caption Routes (`/api/projects`)
- `POST /api/projects/upload` — Multipart form: `video` file + `targetStyle`
- `GET /api/projects` — Paginated list of user projects.
- `GET /api/projects/:id/timeline` — Fetch full timeline JSON.
- `PUT /api/projects/:id/timeline` — Body: `{ timeline }` $\to$ Save timeline edits.
- `POST /api/projects/:id/export` — Trigger server-side 60FPS FFmpeg MP4 render.

---

## 9. Complete File Directory & Module Map

```
auto_captions/
├── README.md                           # Quickstart & GitHub Overview
├── PROJECT_OVERVIEW.md                 # Exhaustive Technical Specification
├── docs/
│   └── fixes/
│       └── HOSTINGER_PAYMENT_DEPLOYMENT_FIX.md # Hostinger Deployment & Payment Fix Log
│
├── backend/
│   ├── src/
│   │   ├── app.js                     # Express server & CORS setup
│   │   ├── config/env.js              # Environment variable loader
│   │   ├── controllers/
│   │   │   ├── authController.js      # Auth request handlers
│   │   │   ├── paymentController.js   # Cashfree order creation & plan verification
│   │   │   └── projectController.js   # Upload, Timeline & Export handlers
│   │   ├── db/
│   │   │   ├── pool.js                # PostgreSQL connection pool
│   │   │   ├── initDb.js              # Database initialization & migrations
│   │   │   └── schema.sql             # SQL Schema definition
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT verification & optionalAuth middleware
│   │   │   └── errorHandler.js        # Centralized error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.js         # Auth routes
│   │   │   ├── payment.routes.js      # Payment & Cashfree webhook routes
│   │   │   └── project.routes.js      # Project routes
│   │   ├── services/
│   │   │   ├── authService.js         # User registration & profile query with plan/credits
│   │   │   ├── payment/
│   │   │   │   └── cashfreeService.js # Cashfree v3 REST API order session service
│   │   │   └── llm/
│   │   │       └── GeminiCaptionDirector.js # Gemini STT & Sync Engine
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axiosClient.js         # Axios client with JWT interceptors
    │   ├── components/
    │   │   ├── common/                # Header, AuthModal, Footer, Password Toggle
    │   │   ├── editor/                # CanvasVideoPlayer, TimelineEditor
    │   │   └── pricing/
    │   │       └── PricingModal.jsx   # Cashfree Popup Modal trigger & plan switcher
    │   ├── context/
    │   │   └── AuthContext.jsx        # Global user profile, plan, and credits state
    │   ├── pages/
    │   │   ├── DashboardPage.jsx      # Projects dashboard
    │   │   └── legal/                 # Privacy Policy, Terms, Refund, Contact Us
    │   └── services/
    │       └── paymentService.js      # Cashfree Checkout SDK modal launcher helper
```

---

## 10. Hostinger Production Deployment

- **Live URL**: `https://rukhi.in`
- **Server Engine**: CloudLinux + Apache + Phusion Passenger Node.js 20.
- **Build Deployment**: Compiled frontend `dist` tracked in Git and synced directly to `/public_html` and `.builds/current/nodejs/dist`.

---

## 16. Comprehensive Root Cause Analysis & Fix History

| Incident | Root Cause | Engineering Solution |
| :--- | :--- | :--- |
| **`paymentSessionId: null`** | Hostinger `.builds/versions/<hash>/` folders lacked `.env` variables | Synchronized `CASHFREE_APP_ID`, `SECRET_KEY`, and `ENV=PRODUCTION` across all `.env` locations. |
| **`Failed to create payment order session`** | Apache `.htaccess` redirected API errors to `index.html` (HTML instead of JSON) | Added explicit `RewriteCond %{REQUEST_URI} ^/api` bypass rules in `.htaccess`. |
| **Old Razorpay Log Output** | Node process in RAM retained old module cache across disk edits | Issued hard process signal `pkill -9 -f node` and `touch tmp/restart.txt`. |
| **UI Button Showed "Upgrade to Starter" after Payment** | `getUserById()` SQL query omitted `plan` and `credits` columns on profile refresh | Updated SQL query to `SELECT id, name, email, avatar_url, plan, credits, created_at FROM users`. |
| **Veo HTTP 404 Model Not Found** | Veo 2.0 & Veo 3.0 deprecated by Google Cloud | Updated candidate endpoints and default model in `veoVideoService.js` to `veo-3.1-lite-generate-001:predictLongRunning`. |
| **Veo HTTP 400 Image MimeType Empty** | Veo 3.1 Image-to-Video requires explicit image mimeType | Added `mimeType: "image/jpeg"` alongside `bytesBase64Encoded` in request payload. |
| **Veo Code 3 Duration Error** | Veo 3.1 strictly enforces `[4, 6, 8]` duration seconds | Configured `durationSeconds: 6` in `veoVideoService.js` request parameters. |
| **Audio Playing During Export** | `audioSource` was connected to `audioCtx.destination` (speakers) | Disconnected `audioCtx.destination` during canvas export capture so recording is silent. |
| **Video Replay Required Page Refresh** | Video `currentTime` remained stuck at end after video ended | Updated `togglePlay` and `onEnded` in `CanvasVideoPlayer.jsx` to reset `currentTime = 0`. |
| **Raw Audio STT Recovery Fallback** | Meta Demucs vocal separation filtered out low-volume speech on heavy BGM audio | Added automatic secondary re-probing of raw unfiltered audio in `mediaWorker.js` to recover dropped words. |
| **3-Stage Pipeline Forensic Logging** | Lack of visibility into LLM word retention vs raw STT word timestamps | Added 3-stage terminal forensic logging and safety guard in `GeminiCaptionDirector.js` triggering fallback if LLM output drops >30% of spoken words. |
| **Canvas Player Duration Drift** | Canvas player relying solely on fixed timeline duration, causing premature stops or infinite loops | Implemented `getEffectiveDuration()` calculating maximum bound across video, audio, timeline, and final segment end. |

---

## 17. Google Vertex AI Veo 3.1 GA Video Generation Engine

- **Service Endpoint**: `https://us-central1-aiplatform.googleapis.com/v1/projects/ai-quiz-generator-479518/locations/us-central1/publishers/google/models/veo-3.1-lite-generate-001:predictLongRunning`
- **Polling Method**: `POST https://us-central1-aiplatform.googleapis.com/v1/projects/ai-quiz-generator-479518/locations/us-central1/publishers/google/models/veo-3.1-lite-generate-001:fetchPredictOperation`
- **Output Storage Bucket**: `gs://rukhi-bucket`
- **Authentication**: GCP OAuth 2.0 Bearer Access Token minted from Service Account JSON (`rukhi-video@ai-quiz-generator-479518.iam.gserviceaccount.com`).
- **Master Video Export**: FFmpeg 20 Mbps H.264 Ultra-HD video & 320 kbps studio-grade audio remuxing.

---

## 18. Rukhi Production Cost Ledger & Per-User Telemetry Engine

- **Service Module**: [`backend/src/services/studio/productionLedgerService.js`](file:///home/anji/Documents/auto_captions/backend/src/services/studio/productionLedgerService.js)
- **Pricing Configuration**: [`backend/src/config/pricingConfig.js`](file:///home/anji/Documents/auto_captions/backend/src/config/pricingConfig.js)
- **Database Table**: `studio_generation_costs` (PostgreSQL)
- **Admin Dashboard API**: `GET /api/studio/ledger/summary`

### Architectural Capabilities:
1. **Configurable Model Pricing Engine**: Tracks Gemini 2.5 Flash/Pro token rates ($0.075/$0.30 per 1M tokens), Imagen 3 per-image rate ($0.03/img), Veo 3 video second rate ($0.03/s), STT transcription rates (Deepgram $0.0043/min), Audio Dubbing isolation rates ($0.015/min), Voice Cloning & TTS rates, and Storage.
2. **Per-User Telemetry Ledger**: Records every generation run with `generation_id`, `user_id`, `user_email`, real token counts, image counts, video seconds, and exact calculated USD and INR costs.
3. **Admin Telemetry Dashboard**: Provides real-time aggregation of total daily spending, model breakdowns, per-user cost rankings, and recent generation logs.

---

## 19. Rukhi Studio AI Hollywood Production Pipeline

- **Orchestrator Service**: [`backend/src/services/studio/directorOrchestratorService.js`](file:///home/anji/Documents/auto_captions/backend/src/services/studio/directorOrchestratorService.js)
- **Vertex AI Engine**: [`backend/src/services/studio/vertexService.js`](file:///home/anji/Documents/auto_captions/backend/src/services/studio/vertexService.js)

### Production Workflow:
1. **Pinecone Vector RAG Query**: Retrieves past episode story memories from Pinecone index `rukhi-film-engine`.
2. **7-Department Brief Compilation**: Compiles cinematography, story, performance, lighting, editing, sound, and realism specs.
3. **Vertex AI Director Manifest**: Generates Gemini 2.5 Flash director prompt expansions via GCP Service Account OAuth 2.0 (`aiplatform.googleapis.com`), covered 100% by GCP $300 Credits.
4. **Preflight Validator**: Checks character reference keyframes, location bounds, and 180° camera grammar.
5. **Veo 3 & Resilient Image Generation**: Renders scene video clips and character candidate keyframes.
6. **Automatic Telemetry Finalization**: Persists final render duration, token metrics, and total cost to the Production Cost Ledger.

