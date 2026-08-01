# Hostinger Node.js & Cashfree Production Deployment Guide

## 📌 Executive Summary
This document records the exact root causes, architecture quirks, and resolution steps for the Hostinger CloudLinux Passenger Node.js deployment & Cashfree payment gateway integration on `rukhi.in`.

---

## 🔍 Root Causes & Architectural Learnings

### 1. Hostinger Dynamic Versioning (`.builds/versions/<hash>/`)
- **Quirk**: Hostinger's git auto-builder creates a brand new version folder on every deployment under `.builds/versions/<hash>/`.
- **Issue**: Environment files (`.env`) are ignored by git and were not automatically copied into new build folders. Without `.env`, Cashfree API credentials (`CASHFREE_APP_ID` & `CASHFREE_SECRET_KEY`) were missing, resulting in `paymentSessionId: null`.
- **Fix**: Pushed `.env` variables to all Hostinger environment locations (`/home/u209580425/domains/rukhi.in/.env`, `.builds/last-source/.env`, `.builds/versions/*/.env`, and `nodejs/.env`).

### 2. Apache `.htaccess` SPA Request Rewriting
- **Quirk**: The React SPA rewrite rule in `public_html/.htaccess` redirected non-matching paths to `index.html`.
- **Issue**: When an API endpoint errored or was unhandled, Apache intercepted the 404/500 response and served the full SPA HTML page (`<!doctype html>`) instead of JSON. The React app couldn't parse HTML as JSON, throwing `Failed to create payment order session`.
- **Fix**: Configured `.htaccess` rewrite conditions to explicitly exclude `/api`, `/uploads`, and `/outputs` from SPA rewriting:
  ```apache
  RewriteCond %{REQUEST_URI} ^/api [NC,OR]
  RewriteCond %{REQUEST_URI} ^/uploads [NC,OR]
  RewriteCond %{REQUEST_URI} ^/outputs [NC]
  RewriteRule ^ - [L]
  ```

### 3. Passenger Node.js In-Memory Caching
- **Quirk**: Phusion Passenger keeps Node.js ESM modules loaded in RAM across file edits.
- **Issue**: Modifying JS files on disk did not immediately refresh active RAM code, keeping old order handling logic active.
- **Fix**: Enforced hard worker restarts via `touch tmp/restart.txt` and process recycling (`pkill -9 -f node`).

### 4. Git `.gitignore` Blocking Dist Builds & Apache Document Root Sync
- **Quirk**: Vite builds output compiled production assets to `frontend/dist/`, but root `.gitignore` had `dist/` listed, ignoring newly generated asset hashes (`index-4Y84e77X...js`). Furthermore, Hostinger Apache web server serves static files directly from `public_html/`.
- **Issue**: Deploying code changes without explicitly tracking `frontend/dist` and copying files to `public_html/` caused Hostinger to serve outdated cached JS bundles (`index-CxZy8kQM.js` with only 3 old plans).
- **Fix**:
  1. Updated `.gitignore` to explicitly unignore production builds (`!frontend/dist/` and `!frontend/dist/**`).
  2. Upgraded `.github/workflows/deploy.yml` to use `appleboy/ssh-action@v1.0.3` with `HOSTINGER_SSH_PASSWORD`.
  3. Configured the SSH script to pull `main`, sync `frontend/dist/*` directly into `public_html/`, and recycle Node processes (`touch tmp/restart.txt && pkill -9 -f node`).

### 5. 5-Tier Pricing Model & Cashfree Session Synchronization
- **Architecture**: Synchronized `PricingModal.jsx` and `paymentController.js` to support all 5 production subscription plans:
  - **Free Tier** (`free`): ₹0 forever (3 Free Captions)
  - **Basic Captions** (`basic`): ₹79 / month (Unlimited Captions & Subtitle Studio)
  - **Plus 30s Reels** (`starter`): ₹199 / month (10 AI Reels / month)
  - **Pro 60s Reels** (`pro`): ₹299 / month (30 AI Reels / month)
  - **Dubbing Studio** (`dubbing_studio`): ₹399 / month (100 AI Reels / month & Voice Dubbing)

---

## 🛡️ Production Verification Checklist

1. **API Endpoint Verification**:
   - `GET https://rukhi.in/api/health` ➔ Returns `200 OK` (`{"status":"healthy"}`)
   - `POST https://rukhi.in/api/payments/create-order` ➔ Returns `200 OK` with valid Cashfree `paymentSessionId` (`session_...`) and `cashfreeMode: "PRODUCTION"`.

2. **Frontend Checkout & 5 Tiers**:
   - Cashfree v3 JS SDK loaded in `index.html`.
   - `PricingModal.jsx` renders all 5 plans in a responsive 5-column grid with live Cashfree modal launch (`launchCashfreeCheckout`).

3. **CI/CD Automated Deployment**:
   - Pushing to `main` branch automatically triggers GitHub Actions SSH deployment (`.github/workflows/deploy.yml`), syncing code and restarting Hostinger server within seconds.

