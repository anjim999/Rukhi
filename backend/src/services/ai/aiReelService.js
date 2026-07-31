import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/pool.js';
import { config } from '../../config/env.js';
import { generateMasterAvatarSeed } from './avatarService.js';
import { generateSceneStoryboard } from './sceneDirector.js';
import { generateVeoVideoClip, isTransientError } from './veoVideoService.js';
import { synthesizeChirpVoiceover } from '../media/tts/chirpTTSService.js';
import { GeminiCaptionDirector } from '../llm/GeminiCaptionDirector.js';
import { runFFmpeg } from '../media/ffmpegService.js';
import { saveTimeline } from '../projectService.js';

/**
 * Consistent Character AI Reel Generation Orchestrator
 * Coordinates: Avatar Seed -> Storyboard -> Checkpointed Veo Clips -> Chirp TTS -> Submagic Captions -> Master FFmpeg Assembly
 * Hardened for Hostinger production, GCP credit protection, scene checkpointing, butter-smooth 30fps CFR encoding, and zero-lag exports.
 */

export async function generateConsistentAIReel({
  topicPrompt,
  duration = 30,
  stylePreset = 'CINEMATIC',
  voicePreset = 'TE_MALE',
  targetLanguage = 'chatting',
  aspectRatio = '9:16',
  applyWatermark = false,
  userId,
  existingReelId,
}) {
  const reelId = existingReelId || uuidv4();
  console.log(`[AI REEL ENGINE] 🚀 Starting Consistent Character Reel Pipeline (Reel ID: ${reelId}, Duration: ${duration}s, Format: ${aspectRatio}, Watermark: ${applyWatermark}, Topic: "${topicPrompt}")...`);

  let validUserId = null;
  if (userId && typeof userId === 'string' && userId.length === 36) {
    validUserId = userId;
  }

  // Stage 0: Register initial project in DB as 'processing' to prevent job loss on HTTP timeouts
  try {
    await query(
      `INSERT INTO projects (id, user_id, title, video_url, status, duration)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET status = 'processing', duration = EXCLUDED.duration`,
      [reelId, validUserId, topicPrompt.substring(0, 50) || 'AI Reel', '', 'processing', duration]
    );
    console.log(`[AI REEL STAGE 0/6] ✅ Registered project ${reelId} in database with status='processing'.`);
  } catch (dbInitErr) {
    console.warn(`[AI REEL DB WARN] Stage 0 database registration notice: ${dbInitErr.message}`);
  }

  const outputUrl = `/outputs/ai_reel_${reelId}.mp4`;
  const stitchedVideoPath = path.join(config.outputDir, `ai_reel_${reelId}.mp4`);

  try {
    // Stage 1: Generate Master Avatar Seed Anchor
    console.log(`[AI REEL STAGE 1/6] Creating Master Avatar Seed Anchor...`);
    const avatar = await generateMasterAvatarSeed({ stylePreset, customDescription: topicPrompt });
    console.log(`[AI REEL STAGE 1/6] ✅ Master Avatar Seed Anchor created: "${avatar.anchorKeywords}"`);

    // Stage 2: Decompose Storyboard into 6 or 12 Scenes
    console.log(`[AI REEL STAGE 2/6] Decomposing storyboard for ${duration}s video...`);
    const storyboard = await generateSceneStoryboard(topicPrompt, duration, avatar.anchorKeywords, targetLanguage);
    console.log(`[AI REEL STAGE 2/6] ✅ Storyboard created with ${storyboard.scenes.length} scenes.`);

    // Stage 3 & 4: Generate Scenes & Voiceover Tracks (with Scene Checkpointing)
    const generatedClips = [];
    const audioTracks = [];
    let lastFramePath = null;

    for (let i = 0; i < storyboard.scenes.length; i++) {
      const scene = storyboard.scenes[i];
      const clipName = `reel_${reelId}_scene_${i}.mp4`;
      const clipPath = path.join(config.tempDir, clipName);

      const voiceName = `reel_${reelId}_voice_${i}.mp3`;
      const voicePath = path.join(config.tempDir, voiceName);

      const nextLastFramePath = path.join(config.tempDir, `reel_${reelId}_lastframe_${i}.jpg`);

      // Checkpoint Check: Does the scene clip already exist and have valid size?
      let clipReady = false;
      if (fs.existsSync(clipPath) && fs.statSync(clipPath).size > 10000) {
        console.log(`[AI REEL STAGE 3/6] ⚡ [CHECKPOINT HIT] Scene ${i + 1}/${storyboard.scenes.length} already generated! SKIPPING Veo call & reusing ${clipName}.`);
        clipReady = true;
        if (fs.existsSync(nextLastFramePath)) {
          lastFramePath = nextLastFramePath;
        }
      }

      // If clip is not ready, generate with selective transient retry logic
      if (!clipReady) {
        let attempts = 0;
        const maxAttempts = 3;
        let lastSceneErr = null;

        while (attempts < maxAttempts) {
          attempts++;
          try {
            console.log(`[AI REEL STAGE 3/6] 🎬 Generating Scene ${i + 1}/${storyboard.scenes.length} (Attempt ${attempts}/${maxAttempts})...`);
            await generateVeoVideoClip({
              scenePrompt: scene.scenePrompt,
              startImagePath: lastFramePath,
              outputVideoPath: clipPath,
              aspectRatio,
            });
            clipReady = true;
            break;
          } catch (sceneErr) {
            lastSceneErr = sceneErr;
            console.error(`[AI REEL STAGE 3/6 ERROR] Scene ${i + 1} attempt ${attempts} failed:\n`, sceneErr.stack || sceneErr.message);

            if (!isTransientError(sceneErr)) {
              console.error(`[AI REEL STAGE 3/6 FATAL] Non-transient error detected for Scene ${i + 1}. Aborting retries immediately to protect credits.`);
              throw sceneErr;
            }

            if (attempts < maxAttempts) {
              const backoffMs = attempts * 3000;
              console.log(`[AI REEL STAGE 3/6 RETRY] Waiting ${backoffMs / 1000}s before retrying Scene ${i + 1}...`);
              await new Promise((r) => setTimeout(r, backoffMs));
            }
          }
        }

        if (!clipReady) {
          throw lastSceneErr || new Error(`Failed to generate scene ${i + 1} after ${maxAttempts} attempts.`);
        }
      }

      generatedClips.push(clipPath);

      // Extract end frame of generated clip for last-frame continuation into scene N+1
      try {
        if (!fs.existsSync(nextLastFramePath) && fs.existsSync(clipPath)) {
          await runFFmpeg([
            '-sseof', '-0.5',
            '-i', clipPath,
            '-update', '1',
            '-q:v', '2',
            '-y',
            nextLastFramePath,
          ]);
        }
        if (fs.existsSync(nextLastFramePath)) {
          lastFramePath = nextLastFramePath;
          console.log(`[AI REEL STAGE 3/6] 📸 Last-frame continuation anchor ready for scene ${i + 1}: ${lastFramePath}`);
        }
      } catch (frameErr) {
        console.warn(`[AI REEL STAGE 3/6 WARN] Frame extraction notice for scene ${i + 1}: ${frameErr.message}`);
      }

      // Voiceover Checkpoint & Generation
      if (fs.existsSync(voicePath) && fs.statSync(voicePath).size > 1000) {
        console.log(`[AI REEL STAGE 4/6] ⚡ [CHECKPOINT HIT] Voiceover for scene ${i + 1} exists. Reusing audio.`);
      } else {
        try {
          await synthesizeChirpVoiceover({
            text: scene.speechNarration,
            voicePreset,
            outputPath: voicePath,
          });
        } catch (voiceErr) {
          console.warn(`[AI REEL STAGE 4/6 WARN] Voiceover synthesis notice for scene ${i + 1}: ${voiceErr.message}`);
        }
      }
      if (fs.existsSync(voicePath)) {
        audioTracks.push(voicePath);
      }
    }

    console.log(`[AI REEL STAGE 3 & 4/6] ✅ All ${generatedClips.length} video scenes ready!`);

    // Stage 5: Per-Scene Normalization & Master FFmpeg Concat Assembly
    console.log(`[AI REEL STAGE 5/6] 🎬 Normalizing ${generatedClips.length} scenes for butter-smooth 30fps CFR playback (Format: ${aspectRatio})...`);

    let targetWidth = 1080;
    let targetHeight = 1920;
    if (aspectRatio === '16:9') {
      targetWidth = 1920;
      targetHeight = 1080;
    } else if (aspectRatio === '1:1') {
      targetWidth = 1080;
      targetHeight = 1080;
    }

    const normalizedClips = [];

    for (let i = 0; i < generatedClips.length; i++) {
      const vidClip = generatedClips[i];
      const audClip = audioTracks[i];
      const normClipPath = path.join(config.tempDir, `reel_${reelId}_norm_${i}.mp4`);

      if (fs.existsSync(normClipPath) && fs.statSync(normClipPath).size > 10000) {
        console.log(`[AI REEL STAGE 5/6] ⚡ [CHECKPOINT HIT] Normalized scene clip ${i + 1} ready.`);
        normalizedClips.push(normClipPath);
        continue;
      }

      console.log(`[AI REEL STAGE 5/6] 🛠️ Encoding Scene ${i + 1}/${generatedClips.length} (30fps CFR, H.264 High, AAC 44.1kHz)...`);

      const inputs = ['-i', vidClip];
      if (audClip && fs.existsSync(audClip)) {
        inputs.push('-i', audClip);
      } else {
        inputs.push('-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo');
      }

      const vfFilter = `fps=30,scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,format=yuv420p`;

      try {
        await runFFmpeg([
          ...inputs,
          '-filter_complex', `[0:v]${vfFilter}[v]`,
          '-map', '[v]',
          '-map', '1:a',
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '18',
          '-r', '30',
          '-g', '30',
          '-keyint_min', '30',
          '-sc_threshold', '0',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-ar', '44100',
          '-ac', '2',
          '-shortest',
          '-y',
          normClipPath,
        ]);
      } catch (normErr) {
        console.warn(`[AI REEL STAGE 5/6 WARN] Scene ${i + 1} complex normalization notice (${normErr.message}). Using standard encode.`);
        await runFFmpeg([
          '-i', vidClip,
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '18',
          '-r', '30',
          '-g', '30',
          '-pix_fmt', 'yuv420p',
          '-y',
          normClipPath,
        ]);
      }

      if (fs.existsSync(normClipPath) && fs.statSync(normClipPath).size > 10000) {
        normalizedClips.push(normClipPath);
      } else {
        normalizedClips.push(vidClip);
      }
    }

    console.log(`[AI REEL STAGE 5/6] 🎞️ Concatenating ${normalizedClips.length} normalized scene clips...`);
    const listPath = path.join(config.tempDir, `list_${reelId}.txt`);
    const listContent = normalizedClips.map((c) => `file '${c.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(listPath, listContent);

    await runFFmpeg([
      '-f', 'concat',
      '-safe', '0',
      '-i', listPath,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '18',
      '-r', '30',
      '-g', '30',
      '-keyint_min', '30',
      '-sc_threshold', '0',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-ar', '44100',
      '-ac', '2',
      '-movflags', '+faststart',
      '-y',
      stitchedVideoPath,
    ]);

    console.log(`[AI REEL STAGE 5/6] ✅ Stitched Consistent AI Reel Video ready: ${stitchedVideoPath}`);

    // Apply small "rukhi" corner watermark for Plus Plan
    if (applyWatermark) {
      try {
        const logoCandidates = [
          path.resolve(process.cwd(), 'frontend/public/favicon.png'),
          path.resolve(process.cwd(), 'public/favicon.png'),
          path.resolve(process.cwd(), 'frontend/public/favicon.ico'),
        ];
        let activeLogoPath = logoCandidates.find((p) => fs.existsSync(p));
        if (activeLogoPath) {
          const wmPath = path.join(config.tempDir, `reel_${reelId}_wm.mp4`);
          console.log(`[AI REEL STAGE 5/6] 🏷️ Applying small "rukhi" corner watermark overlay (${activeLogoPath})...`);
          await runFFmpeg([
            '-i', stitchedVideoPath,
            '-i', activeLogoPath,
            '-filter_complex', '[1:v]scale=28:28[logo];[0:v][logo]overlay=main_w-overlay_w-15:main_h-overlay_h-20',
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '18',
            '-r', '30',
            '-c:a', 'copy',
            '-y',
            wmPath,
          ]);
          if (fs.existsSync(wmPath) && fs.statSync(wmPath).size > 10000) {
            fs.renameSync(wmPath, stitchedVideoPath);
            console.log(`[AI REEL STAGE 5/6] ✅ Watermark successfully applied to final reel.`);
          }
        }
      } catch (wmErr) {
        console.warn(`[AI REEL STAGE 5/6 WARN] Watermark application notice: ${wmErr.message}`);
      }
    }

    // Clean up temporary list file
    try {
      if (fs.existsSync(listPath)) fs.unlinkSync(listPath);
    } catch (_) {}

    // Stage 6: Generate Kinetic Submagic Captions & Update DB Status to Completed
    const director = new GeminiCaptionDirector();
    const fullNarrationScript = storyboard.scenes.map((s) => s.speechNarration).join(' ');

    try {
      await query(
        `INSERT INTO projects (id, user_id, title, video_url, status, duration)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET video_url = EXCLUDED.video_url, status = 'completed', duration = EXCLUDED.duration`,
        [reelId, validUserId, storyboard.title || 'AI Reel', outputUrl, 'completed', duration]
      );
      console.log(`[AI REEL STAGE 6/6] ✅ Updated project ${reelId} status to 'completed' in database.`);

      // Build & save initial caption timeline JSON for Studio Editor
      const wordsArr = fullNarrationScript.split(' ').filter(Boolean);
      const avgWordDur = duration / Math.max(1, wordsArr.length);
      const words = wordsArr.map((w, idx) => ({
        id: `word-${idx}`,
        text: w,
        start: Number((idx * avgWordDur).toFixed(2)),
        end: Number(((idx + 1) * avgWordDur).toFixed(2)),
        highlight: true,
      }));

      const segments = [
        {
          id: 'seg-0',
          start: 0,
          end: duration,
          text: fullNarrationScript,
          words,
        },
      ];

      const initialTimeline = {
        version: '1.0',
        videoUrl: outputUrl,
        duration,
        aspectRatio,
        tracks: [
          {
            id: 'track-video-1',
            type: 'video',
            label: 'AI Reel Video',
            clips: [
              {
                id: `clip-video-1`,
                startTime: 0,
                endTime: duration,
                src: outputUrl,
                type: 'video',
              },
            ],
          },
        ],
        words,
        segments,
        style: {
          preset: 'HORMOZI',
          textColor: '#FFFFFF',
          highlightColor: '#00FFFF',
          fontSize: 48,
        },
      };

      await saveTimeline(reelId, initialTimeline);
      console.log(`[AI REEL STAGE 6/6] ✅ Saved caption timeline JSON for AI Reel ${reelId}`);
    } catch (dbErr) {
      console.warn(`[AI REEL DB WARN] Failed to update project status: ${dbErr.message}`, dbErr.stack || '');
    }

    // Hostinger Temp Cleanup: Remove intermediate scene files to prevent disk exhaustion
    try {
      const filesToPurge = [...generatedClips, ...audioTracks, ...normalizedClips];
      for (const f of filesToPurge) {
        if (fs.existsSync(f) && f !== stitchedVideoPath) {
          try { fs.unlinkSync(f); } catch (_) {}
        }
      }
      console.log(`[AI REEL CLEANUP] 🧹 Cleaned up temporary scene files from /temp.`);
    } catch (cleanErr) {
      console.warn(`[AI REEL CLEANUP WARN] Notice during temp cleanup: ${cleanErr.message}`);
    }

    return {
      reelId,
      id: reelId,
      title: storyboard.title,
      videoUrl: outputUrl,
      fullNarrationScript,
      duration,
      scenesCount: storyboard.scenes.length,
      status: 'COMPLETED',
    };
  } catch (fatalErr) {
    console.error(`[AI REEL ENGINE FATAL ERROR] Top-to-bottom pipeline failure for reel ${reelId}:\n`, fatalErr.stack || fatalErr.message);

    try {
      await query(
        `UPDATE projects SET status = 'failed' WHERE id = $1`,
        [reelId]
      );
    } catch (_) {}

    throw fatalErr;
  }
}
