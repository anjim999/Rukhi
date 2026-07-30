# Auto Captions AI — Broadcast-Grade Reel Caption & Video Editing SaaS Engine

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-60FPS_Engine-0078D7?style=for-the-badge&logo=ffmpeg&logoColor=white)](https://ffmpeg.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Cashfree Payments](https://img.shields.io/badge/Cashfree-v3_Production-00B259?style=for-the-badge&logo=cashfree&logoColor=white)](https://www.cashfree.com/)

> **Auto Captions AI (rukhi.in)** is a production-grade, Submagic & Opus Clip-style SaaS platform engineered to generate high-converting, viral kinetic captions, animated subtitles, and social media post packs for Instagram Reels, YouTube Shorts, and TikTok with **100% millisecond-accurate video-audio-caption synchronization**.

---

## 🌟 Executive Overview & Key Capabilities

Auto Captions AI transforms raw audio and video into viral reels with word-by-word kinetic typography, customizable animations, emojis, and sound effects.

### Core Features

* 🎙️ **Direct Audio Speech-to-Text & Transcribing Director**: Powered by Google Gemini 2.5 Flash & Deepgram Nova-3 Multilingual, directly processing audio waveforms to handle Telugu, Hinglish, Teluglish, Hindi, English, and code-switched speech.
* 💯 **100% Verbatim 1:1 Word Preservation Constraint**: Strict negative prompt rules in `GeminiCaptionDirector.js` prevent LLMs from dropping or summarizing words. If spoken audio has 22 words, the output timeline contains all 22 words in exact 1:1 sequence!
* 🌐 **Fail-Safe Local Telglish Transliteration Engine (`transliterateTeluguToRoman`)**: Built-in deterministic Unicode transliterator converts native Telugu script (`తమ్ముడు...`) into clean Romanized chat script (`tammudu okka nimisham...`) if Gemini is rate-limited, guaranteeing native script **NEVER** bleeds onto screen when `chatting` / `tel_eng` mode is selected.
* 🎤 **Demucs AI Vocal Separator & Deepgram Nova-3 Engine**: Meta `htdemucs` vocal isolation pipeline running on Python 3.11 with single-threaded bounds (`OMP_NUM_THREADS=1`, `--jobs 1`) combined with Deepgram Nova-3 for 98%+ speech-to-text accuracy even on heavy BGM audio.
* ⚡ **Perfect Video-Audio-Caption Sync Engine**: Built-in `_validateAndRepairTimestamps()` algorithm enforcing monotonic word ordering, millisecond timing precision, overlap repair, and seamless gap filling.
* 🌊 **Broadcast-Grade Ripple Sync & Nudge Controls**: Automatic downstream timeline shift upon timestamp edits, 1-click nudge controls (`-0.5s`, `-0.1s`, `+0.1s`, `+0.5s`), and global offset correction.
* 💳 **Bank-Grade Cashfree v3 Production Payment Gateway**: Monetization architecture featuring Starter Creator (₹199 / 25 videos) and Pro Unlimited (₹399 / unlimited) tiers with Cashfree Popup Checkout modal (`redirectTarget: '_modal'`), real-time webhook listeners (`/api/payment/cashfree-webhook`), and automatic PostgreSQL subscription activation.
* 📜 **Legal Compliance Suite**: Fully compliant Privacy Policy, Terms of Service with Anti-Deepfake/Zero-Abuse policies, Refund Policy (7-Day Money Back Guarantee), and Contact Us pages with live interactive UI components.
* 🌐 **70+ Multilingual Typography Suite & Font Studio Modal**: Native Google Fonts for English, Hindi (Devanagari script), and Telugu script with live rendered script previews and language category filtering.
* ⚛️ **Un-Clipped React Portal Dropdowns (`CustomFontSelect.jsx`)**: Floating `rounded-2xl` popovers rendered on `document.body` with built-in font search bar.
* 🎨 **Interactive 60FPS Hardware-Synced Canvas Editor**: Built using React & HTML5 Canvas with `requestVideoFrameCallback` rendering for 1:1 stutter-free playback and frame-accurate seeking.
* 📐 **Aspect-Ratio & Responsive Math**: Supports 9:16 Vertical Reels, 16:9 Widescreen, and 1:1 Square videos with dynamic font scaling and viewport safe-zone calculations.
* 🎭 **15+ Kinetic Animation Physics Engines**: Pop, Bounce, Zoom In/Out, Slide Up/Left, Shake Rumble, Flip Rotate, and Glow Pulse animations.
* 🎬 **100% WYSIWYG Pixel-Perfect Export & Remux Engine**: Uses `-c:v mpeg4 -q:v 2` on Hostinger container environments to bypass Linux `libx264` shared-memory kernel restrictions, completing exports in **2 to 4 seconds**.

---

## 🛠️ Deployment & Fix Documentation

- 📚 **Exhaustive Technical Architecture**: [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)
- 🔧 **Hostinger Deployment & Payment Fix Log**: [docs/fixes/HOSTINGER_PAYMENT_DEPLOYMENT_FIX.md](docs/fixes/HOSTINGER_PAYMENT_DEPLOYMENT_FIX.md)

---

## 🛠️ Quick Start & Local Setup

### Prerequisites
* **Node.js**: v18.x or higher
* **PostgreSQL**: v15.x running locally or remotely (Neon Cloud supported)
* **Redis**: Running on `127.0.0.1:6379` (for BullMQ queues)
* **Cashfree Merchant Account**: Production Credentials (`CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`)

---

### Local Development Commands

```bash
# 1. Start Backend API Server
cd backend && npm run dev

# 2. Start BullMQ Media Worker
cd backend && npm run worker

# 3. Start Frontend Vite Development Server
cd frontend && npm run dev
```

---

## 🌐 Live Production Deployment

Auto Captions AI is deployed live on Hostinger Business Web Hosting under custom domain **[https://rukhi.in](https://rukhi.in)**.

* **Live Application**: **[https://rukhi.in](https://rukhi.in)** 🔒
* **Node.js Engine**: Node.js 20.x runtime (`src/app.js`)
* **Database**: Neon Cloud PostgreSQL (SSL Encrypted)
* **Payment Engine**: Cashfree v3 Production REST API
* **Persistent Media Storage**: `/home/u209580425/persistent_storage`
