# Auto Captions Backend

Production-grade API server and background worker engine for the AI Auto Caption Generation Platform.

## Tech Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express
- **Database**: PostgreSQL
- **Queue**: Redis + BullMQ
- **Media**: FFmpeg
- **AI**: Gemini (Caption Director), Whisper (STT)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment config
cp .env.example .env
# Edit .env with your PostgreSQL, Redis, and Gemini API key

# 3. Create the database
createdb auto_captions_db
psql auto_captions_db < src/db/schema.sql

# 4. Start API server (dev mode with auto-reload)
npm run dev

# 5. Start the media processing worker (separate terminal)
npm run worker
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/projects/upload` | Upload video & create project |
| GET | `/api/projects` | List user projects (paginated) |
| GET | `/api/projects/:id` | Get single project |
| GET | `/api/projects/:id/timeline` | Get caption timeline JSON |
| PUT | `/api/projects/:id/timeline` | Update timeline (editor saves) |
| DELETE | `/api/projects/:id` | Delete project |

## Architecture

```
src/
├── app.js                          # Express server entry point
├── config/env.js                   # Environment configuration
├── db/
│   ├── pool.js                     # PostgreSQL connection pool
│   └── schema.sql                  # Database schema
├── middleware/
│   └── errorHandler.js             # Centralized error handler + AppError class
├── routes/
│   └── project.routes.js           # Project API routes
├── controllers/
│   └── projectController.js        # Request/response handling
├── services/
│   ├── projectService.js           # Project business logic
│   ├── queue/queueService.js       # BullMQ queues & job producers
│   ├── media/ffmpegService.js      # FFmpeg audio extraction & probing
│   ├── stt/
│   │   ├── STTProvider.js          # Abstract STT interface
│   │   └── LocalWhisperProvider.js # Local Whisper implementation
│   └── llm/
│       ├── LLMProvider.js          # Abstract LLM interface
│       └── GeminiCaptionDirector.js# Gemini caption intelligence
├── workers/
│   └── mediaWorker.js              # BullMQ media processing consumer
└── utils/
    └── fileUpload.js               # Multer video upload config
```
