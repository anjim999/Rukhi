# PROJECT SUMMARY FOR AI & DEVELOPERS

## 📌 Project Overview
**Auto Captions AI (rukhi.in)** is a production-grade SaaS platform built using React 18, Node.js, Express, PostgreSQL, Redis BullMQ, and FFmpeg. It provides Submagic & Opus Clip-style kinetic subtitle editing, AI video generation (Veo 3.1 & Gemini 3.5 Flash via Vertex AI), Meta Demucs vocal separation, and multilingual voice dubbing.

---

## 🏗️ Architecture & Model Mapping

1. **Vertex AI Gemini Integration (`backend/src/services/ai/vertexAiGeminiService.js`)**:
   - Model: **`gemini-3.5-flash`** (GCP Agent Platform Model Garden).
   - Auth: GCP OAuth 2.0 Bearer token via `backend/gcp_key.json`.
   - Coverage: 100% covered by GCP $300 Free Trial Cloud Credits.

2. **Backend Services Architecture**:
   - `backend/src/services/ai/sceneDirector.js`: Storyboard script generation using `gemini-3.5-flash`.
   - `backend/src/services/llm/GeminiCaptionDirector.js`: Kinetic subtitle translation and verbatim word-level alignment.
   - `backend/src/services/media/demucsService.js`: Vocal isolation using Python Demucs (`htdemucs`).
   - `backend/src/controllers/projectController.js`: Handles project status, draft timeline fetching, export, and status polling.

3. **Frontend Editor Architecture**:
   - `frontend/src/pages/EditorPage.jsx`: 3-Column layout (`PresetSidebar`, `CanvasVideoPlayer`, `TimelineEditor`).
   - `frontend/src/components/editor/TimelineEditor.jsx`: Subtitle card editing, silence gap detection, and hook banners.
   - `frontend/src/components/pricing/PricingModal.jsx`: Monetization cards (Free, Basic ₹79, Plus 30s Reels ₹199, Pro Unlimited ₹399, Agency Ultra).

---

## 🛠️ Hostinger Deployment Path
- Server Directory: `/home/u209580425/domains/rukhi.in/nodejs/`
- Git Origin: `https://github.com/anjim999/rocky-captions.git`
- Restart Command: `touch tmp/restart.txt`
