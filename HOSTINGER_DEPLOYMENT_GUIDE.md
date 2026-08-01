# 🚀 Hostinger Deployment Guide — rukhi.in (Fresh Setup)

> **Last Updated**: August 2026  
> **Project**: Auto Captions AI (rukhi.in)  
> **Platform**: Hostinger Business Web Hosting (Node.js via Phusion Passenger)

---

## 📌 Architecture

```
Browser Request → Hostinger CDN → Phusion Passenger → index.js → Express (app.js)
                                                                    ├── /api/*     → Backend API routes
                                                                    ├── /uploads/* → Static media files
                                                                    ├── /outputs/* → Rendered exports
                                                                    └── /*         → React SPA (frontend/dist/)
```

| Component | Technology |
|---|---|
| Frontend | React 18 + Vite (static build in `frontend/dist/`) |
| Backend | Node.js + Express (in `backend/src/app.js`) |
| Database | Neon PostgreSQL (external cloud) |
| Queue | Cloud Redis + BullMQ (external) |
| Hosting | Hostinger Business (Mumbai datacenter) |
| CI/CD | GitHub Actions (auto-deploy on push to `main`) |

---

## 🏗️ Server Directory Structure

```
/home/<username>/domains/rukhi.in/public_html/
├── .htaccess              ← Passenger config (4 lines only!)
├── index.js               ← Entry point (imports backend/src/app.js)
├── app.js                 ← Alternative entry
├── backend/
│   ├── .env               ← Production environment variables
│   ├── src/
│   │   └── app.js         ← Express server (API + SPA serving)
│   ├── node_modules/      ← Production dependencies
│   └── package.json
├── frontend/
│   └── dist/              ← Vite production build
│       ├── index.html
│       └── assets/        ← Hashed JS/CSS (cache-busted)
├── uploads/               ← User-uploaded media
├── outputs/               ← Rendered exports
├── storage/logs/          ← Application logs
└── tmp/
    └── restart.txt        ← Touch this to restart Passenger
```

---

## 🔧 Key Configuration Files

### `.htaccess` (Root — Passenger Config)
```apache
PassengerAppRoot "/home/<username>/domains/rukhi.in/public_html"
PassengerAppType node
PassengerStartupFile index.js
PassengerEnabled on
```
> ⚠️ **DO NOT add rewrite rules here.** Express handles ALL routing internally. This was the root cause of the previous deployment failure.

### Cache-Busting Strategy
- **JS/CSS assets**: Vite generates hashed filenames (`index-abc123-1722500000.js`) → cached 7 days
- **index.html**: Express serves with `Cache-Control: no-cache, no-store, must-revalidate` → NEVER cached
- **Result**: Every page load fetches the latest `index.html` which points to the latest hashed assets

---

## 🚀 How to Deploy (One Push)

### Automatic (CI/CD — Recommended)
```bash
git add .
git commit -m "your change description"
git push origin main
```
GitHub Actions will automatically:
1. Build the Vite frontend bundle
2. Package frontend + backend into `deploy.tar.gz`
3. Transfer to Hostinger via SCP
4. Install backend dependencies on server
5. Provision `.env` from GitHub Secrets
6. Restart Passenger
7. Run health check

### Manual Deployment (SSH)
```bash
# 1. SSH into Hostinger
ssh -p <port> <username>@<host>

# 2. Navigate to deploy directory
cd ~/domains/rukhi.in/public_html

# 3. Pull latest code
git fetch origin main && git reset --hard origin/main

# 4. Install backend deps
cd backend && npm install --omit=dev && cd ..

# 5. Build frontend (if Node.js 20+ available on server)
cd frontend && npm install && npm run build && cd ..

# 6. Restart
touch tmp/restart.txt
```

---

## 🔐 GitHub Secrets Required

Go to: GitHub → `anjim999/Rukhi` → Settings → Secrets → Actions

| Secret Name | Description |
|---|---|
| `HOSTINGER_SSH_HOST` | SSH host IP from Hostinger panel |
| `HOSTINGER_SSH_USER` | SSH username (e.g., `u209580425`) |
| `HOSTINGER_SSH_PASSWORD` | SSH password |
| `HOSTINGER_SSH_PORT` | SSH port (usually `65002`) |
| `PRODUCTION_ENV` | Full contents of `backend/.env` for production |

---

## ✅ Verification Checklist

| Check | Command |
|---|---|
| API health | `curl https://rukhi.in/api/health` |
| Frontend loads | Open `https://rukhi.in` in browser |
| SSL active | Check `https://` lock icon |
| SPA routing | Navigate directly to `/login`, `/dashboard` |
| No stale cache | Deploy change → hard refresh → see update immediately |

---

## 🐛 Troubleshooting

| Problem | Solution |
|---|---|
| 503 Service Unavailable | Passenger failed to start. SSH in and check `cat tmp/restart.txt`, check Node.js errors |
| API returns 404 | Check `.htaccess` has Passenger config. Do NOT add RewriteRules. |
| Frontend shows old version | The `no-cache` headers on `index.html` should fix this. Hard refresh with `Ctrl+Shift+R` |
| CORS errors | Express CORS is set to `origin: true` — should work. Check browser console. |
| DB connection error | Check `backend/.env` has correct `DATABASE_URL` for Neon PostgreSQL |
