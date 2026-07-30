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

---

## 🛡️ Production Verification Checklist

1. **API Endpoint Verification**:
   - `GET https://rukhi.in/api/health` ➔ Returns `200 OK` (`{"status":"healthy"}`)
   - `POST https://rukhi.in/api/payments/create-order` ➔ Returns `200 OK` with valid Cashfree `paymentSessionId` (`session_...`) and `cashfreeMode: "PRODUCTION"`.

2. **Frontend Checkout**:
   - Cashfree v3 JS SDK loaded in `index.html`.
   - `PricingModal.jsx` launches popup checkout via `window.Cashfree({ mode: 'PRODUCTION' }).checkout({ paymentSessionId, redirectTarget: '_modal' })`.

3. **Webhook Setup**:
   - Webhook URL: `https://rukhi.in/api/payment/cashfree-webhook`
   - Version: `2023-08-01`
   - Events Subscribed: `success payment`, `failed payment`, `payment verification update`, `user dropped payment`.
