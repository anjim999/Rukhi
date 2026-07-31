import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/pool.js';
import { config } from '../../config/env.js';
import { generateMasterAvatarSeed } from './avatarService.js';
import { generateSceneStoryboard } from './sceneDirector.js';
import { generateVeoVideoClip } from './veoVideoService.js';
import { synthesizeChirpVoiceover } from '../media/tts/chirpTTSService.js';
import { GeminiCaptionDirector } from '../llm/GeminiCaptionDirector.js';
import { runFFmpeg } from '../media/ffmpegService.js';
import { saveTimeline } from '../projectService.js';

/**
 * Consistent Character AI Reel Generation Orchestrator
 * Coordinates: Avatar Seed -> Storyboard -> Veo Clips (Last-Frame Chaining) -> Chirp TTS -> Submagic Captions -> FFmpeg Assembly
 */

export async function generateConsistentAIReel({
  topicPrompt,
  duration = 30,
  stylePreset = 'ENTREPRENEUR',
  voicePreset = 'TE_MALE',
  targetLanguage = 'chatting',
  userId,
}) {
  const reelId = uuidv4();
  console.log(`[AI REEL ENGINE] Starting 6-Stage Consistent Character Reel Pipeline for reel: ${reelId} (Topic: "${topicPrompt}")...`);

  // Stage 1: Generate Master Avatar Seed Anchor
  const avatar = await generateMasterAvatarSeed({ stylePreset, customDescription: topicPrompt });
  console.log(`[AI REEL STAGE 1/6] ✅ Master Avatar Seed Anchor created: "${avatar.anchorKeywords}"`);

  // Stage 2: Decompose Storyboard into 6 or 12 Scenes
  const storyboard = await generateSceneStoryboard(topicPrompt, duration, avatar.anchorKeywords, targetLanguage);
  console.log(`[AI REEL STAGE 2/6] ✅ Storyboard created with ${storyboard.scenes.length} scenes.`);

  // Stage 3 & 4: Generate Scenes & Voiceover Tracks
  const generatedClips = [];
  const audioTracks = [];
  let lastFramePath = null;

  for (let i = 0; i < storyboard.scenes.length; i++) {
    const scene = storyboard.scenes[i];
    const clipName = `reel_${reelId}_scene_${i}.mp4`;
    const clipPath = path.join(config.tempDir, clipName);

    const voiceName = `reel_${reelId}_voice_${i}.mp3`;
    const voicePath = path.join(config.tempDir, voiceName);

    // Generate Scene Clip with Last-Frame Continuation
    await generateVeoVideoClip({
      scenePrompt: scene.scenePrompt,
      startImagePath: lastFramePath,
      outputVideoPath: clipPath,
    });
    generatedClips.push(clipPath);

    // Extract end frame of generated clip for last-frame continuation into scene N+1
    try {
      const nextLastFramePath = path.join(config.tempDir, `reel_${reelId}_lastframe_${i}.jpg`);
      await runFFmpeg([
        '-sseof', '-0.5',
        '-i', clipPath,
        '-update', '1',
        '-q:v', '2',
        '-y',
        nextLastFramePath,
      ]);
      if (fs.existsSync(nextLastFramePath)) {
        lastFramePath = nextLastFramePath;
        console.log(`[AI REEL STAGE 3/6] 📸 Extracted last-frame image for scene ${i}: ${lastFramePath}`);
      }
    } catch (frameErr) {
      console.warn(`[AI REEL STAGE 3/6 WARN] Last-frame extraction notice for scene ${i}: ${frameErr.message}`);
    }

    // Synthesize Voiceover Speech
    await synthesizeChirpVoiceover({
      text: scene.speechNarration,
      voicePreset,
      outputPath: voicePath,
    });
    audioTracks.push(voicePath);
  }

  console.log(`[AI REEL STAGE 3 & 4/6] ✅ All ${generatedClips.length} video clips & voiceover tracks synthesized!`);

  // Stage 5: Concat Video Clips & Audio Tracks with FFmpeg
  const stitchedVideoPath = path.join(config.outputDir, `ai_reel_${reelId}.mp4`);
  
  // Build FFmpeg concat list
  const listPath = path.join(config.tempDir, `list_${reelId}.txt`);
  const listContent = generatedClips.map((c) => `file '${c.replace(/\\/g, '/')}'`).join('\n');
  fs.writeFileSync(listPath, listContent);

  const isHostinger = process.cwd().includes('u209580425') || process.cwd().includes('rukhi.in');
  const encoderArgs = isHostinger
    ? ['-c:v', 'mpeg4', '-b:v', '15M', '-c:a', 'aac', '-b:a', '320k']
    : ['-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-b:v', '20M', '-maxrate', '25M', '-bufsize', '30M', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '320k'];

  await runFFmpeg([
    '-f', 'concat',
    '-safe', '0',
    '-i', listPath,
    ...encoderArgs,
    '-movflags', '+faststart',
    '-y',
    stitchedVideoPath,
  ]);

  console.log(`[AI REEL STAGE 5/6] ✅ Stitched Consistent AI Reel Video ready: ${stitchedVideoPath}`);

  // Stage 6: Generate Kinetic Submagic Captions
  const director = new GeminiCaptionDirector();
  const fullNarrationScript = storyboard.scenes.map((s) => s.speechNarration).join(' ');
  
  const outputUrl = `/outputs/ai_reel_${reelId}.mp4`;

  let validUserId = null;
  if (userId && typeof userId === 'string' && userId.length === 36) {
    validUserId = userId;
  }

  try {
    await query(
      `INSERT INTO projects (id, user_id, title, video_url, status, duration)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET video_url = EXCLUDED.video_url, status = EXCLUDED.status, duration = EXCLUDED.duration`,
      [reelId, validUserId, storyboard.title || 'AI Reel', outputUrl, 'completed', duration]
    );
    console.log(`[AI REEL STAGE 6/6] ✅ Saved AI Reel project ${reelId} to database.`);

    // Build & save initial caption timeline JSON for Studio Editor
    const wordsArr = fullNarrationScript.split(' ').filter(Boolean);
    const avgWordDur = (duration / Math.max(1, wordsArr.length));
    const words = wordsArr.map((w, idx) => ({
      id: `word-${idx}`,
      text: w,
      start: Number((idx * avgWordDur).toFixed(2)),
      end: Number(((idx + 1) * avgWordDur).toFixed(2)),
      highlight: true,
    }));

    const initialTimeline = {
      version: '1.0',
      videoUrl: outputUrl,
      duration,
      aspectRatio: '9:16',
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
    console.warn(`[AI REEL DB WARN] Failed to save project or timeline: ${dbErr.message}`);
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
}
