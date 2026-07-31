# Technical Report: Google Vertex AI Gemini 2.5 Migration & 72-Hour Persistent Media Storage Pipeline

> **Date**: July 31, 2026  
> **Status**: RESOLVED & LIVE ON PRODUCTION ([`https://rukhi.in`](https://rukhi.in))  
> **Target Systems**: Google Vertex AI, GCP Billing, Hostinger JS Container Engine, Canvas Player, Timeline Editor

---

## 1. Executive Summary & Root Cause Overview

This documentation specifies four major architectural upgrades and stability fixes deployed to **Rukhi.in**:

1. **Google Vertex AI Gemini 2.5 Flash Migration**: Replaced Google AI Studio (`generativelanguage.googleapis.com`) API calls with official Google Vertex AI (`aiplatform.googleapis.com`) REST endpoints powered by GCP Service Account Bearer tokens (`gcp_key.json`). This ensures 100% of LLM transcription and video generation tasks consume active **$300 GCP Free Trial credits** without credit card charges.
2. **72-Hour Persistent Media Storage & Deployment Sync**: Resolved media disappearance issues where generated video reels (such as Veo 3.1 reels) returned `HTTP 404 Not Found`. Modified `auto_upload_env.js` deployment script to include `outputs/` and `uploads/` directories in production zip bundles, and updated `cleanupService.js` to calculate file age using earliest creation timestamps (`Math.min(birthtime, ctime, mtime)`).
3. **Seamless 2nd-Time Canvas Video Replay**: Fixed HTML5 `<video>` and `<audio>` decoding freeze on replay attempts by safely resetting `currentTime = 0` without calling `.load()` (which was aborting the `.play()` Promise).
4. **Responsive Top-Level Studio Layout**: Re-ordered flex/grid elements in `EditorPage.jsx` so that the **Canvas Video Player** and **Timeline Subtitles & Timing Panel** are rendered right at the top on all screen sizes and window zoom levels.

---

## 2. Google Vertex AI Gemini 2.5 Architecture

### Problem
Google Cloud Billing excludes Google AI Studio API calls (`generativelanguage.googleapis.com` with `AIza...` API keys) from the $300 Free Trial credits, billing charges directly to registered credit cards.

### Solution
Created a dedicated Vertex AI REST client ([`vertexAiGeminiService.js`](file:///home/anji/Documents/auto_captions/backend/src/services/ai/vertexAiGeminiService.js)) using RSA-SHA256 OAuth 2.0 Bearer tokens minted from `gcp_key.json`:

```text
Endpoint: https://us-central1-aiplatform.googleapis.com/v1/projects/ai-quiz-generator-479518/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent
Authentication: Bearer <GCP_OAUTH_TOKEN>
Billing: 100% Covered by GCP $300 Promotional Credits (Net Cost: $0.00)
```

---

## 3. 72-Hour Media Persistence & Cleanup Daemon

### Storage Lifecycle
- **Persistent Storage Directory**: `/home/u209580425/persistent_storage/outputs`
- **File Expiry**: `72 * 60 * 60 * 1000` (72 Hours)
- **Database Cleanup**: `DELETE FROM projects WHERE created_at < NOW() - INTERVAL '72 hours'`

### Manual Deletion Warning Modal
When a user manually deletes a project from `DashboardPage.jsx`, a confirmation warning modal pops up:
> *"Are you sure you want to permanently delete this project? This will permanently purge the video reel and all subtitle assets from the database and server."*

---

## 4. Verification & Deployment Status

- **Hostinger Production**: Deployed to `https://rukhi.in` (`HTTP/2 200 OK`)
- **GitHub Repository**: Committed & pushed to branch `dev` (Commit: `3d6182c`)
