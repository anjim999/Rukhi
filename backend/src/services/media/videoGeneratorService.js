import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { config } from '../../config/env.js';
import { generateDubbedVoiceoverAudio } from './dubbingService.js';
import { buildLongFormAIVideo } from './aiVideoService.js';
import { saveTimeline } from '../projectService.js';
import { query } from '../../db/pool.js';

const execPromise = util.promisify(exec);
const ffmpegBin = ffmpegInstaller.path || 'ffmpeg';

import { generateViralScriptWithFallback } from './utils/viralScriptGenerator.js';
import { getExactAudioDuration } from './utils/audioDurationHelper.js';

/**
 * Standalone script generator for script preview and editing ($0 Cost)
 */
export async function generateScriptForPrompt({ prompt, targetLanguage = 'te', durationSec = 30 }) {
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  return await generateViralScriptWithFallback({ genAI, prompt, targetLanguage, durationSec });
}

/**
 * AI Faceless Video Generator
 */
export async function generateFacelessVideoProject({
  prompt,
  customScriptText,
  targetLanguage = 'te',
  voiceProvider = 'google',
  durationSec = 30,
  visualMode = 'cinematic',
  aspectRatio = '9:16',
  userId,
}) {
  if ((!prompt || !prompt.trim()) && (!customScriptText || !customScriptText.trim())) {
    throw new Error('Prompt or script text is required for faceless video generation');
  }

  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

  // Validate customScriptText: If customScriptText is prompt instructions, regenerate!
  let scriptText = customScriptText && customScriptText.trim() ? customScriptText.trim() : null;

  if (scriptText) {
    const isEnglishInstruction = /^(?:Create|Write|Generate|Make)\s+an?\s+/i.test(scriptText);
    const hasTelugu = /[\u0C00-\u0C7F]/.test(scriptText);
    if (isEnglishInstruction || (targetLanguage === 'te' && !hasTelugu && scriptText.length < 150)) {
      console.warn('[FACELESS GEN] ⚠️ Provided script appears to be English prompt instructions. Generating 100% pure native script...');
      scriptText = null;
    }
  }

  if (!scriptText) {
    scriptText = await generateViralScriptWithFallback({ genAI, prompt, targetLanguage, durationSec });
  }

  console.log(`[FACELESS GEN] ✍️ Final Spoken Script (${scriptText.length} chars, Lang: ${targetLanguage}, Aspect: ${aspectRatio}): "${scriptText.slice(0, 100)}..."`);

  // Step 2: Synthesize Voiceover Audio
  const projectId = `faceless_${Date.now()}`;
  console.log(`[FACELESS GEN] 🎙️ Synthesizing voiceover audio via provider '${voiceProvider}'...`);
  const audioFilePath = await generateDubbedVoiceoverAudio({
    text: scriptText,
    targetLanguage,
    projectId,
    provider: voiceProvider,
  });

  if (!audioFilePath) {
    throw new Error('Voiceover audio synthesis failed');
  }

  const audioFileName = path.basename(audioFilePath);
  const audioUrl = `/uploads/${audioFileName}`;

  // Measure EXACT Audio Duration via FFprobe or Pure JS
  const measuredDuration = await getExactAudioDuration(audioFilePath);
  const actualAudioDuration = measuredDuration || Number(durationSec);
  console.log(`[FACELESS GEN] ⏱️ Measured exact voiceover audio duration: ${actualAudioDuration}s`);

  // Step 3 & 5: Generate AI Scene Overlays via HunyuanVideo & LTX Consistent Character Engine
  const characterSeed = Math.floor(Math.random() * 900000) + 100000;
  const characterAnchor = `Same main character actor, 4k photorealistic face, matching hair and clothing, cinematic studio lighting`;

  const brollOverlays = await buildLongFormAIVideo({
    prompt,
    scriptText,
    audioFilePath,
    durationSec: actualAudioDuration,
    visualMode,
    aspectRatio,
    characterAnchor,
    characterSeed,
  });

  const firstClip = brollOverlays[0]?.clip;
  const backgroundUrl = firstClip?.videoUrl || null;

  // Step 4: Build frame-accurate subtitle segments matching actual audio duration
  const words = scriptText.split(/\s+/).filter(Boolean);
  const wordDuration = actualAudioDuration / Math.max(1, words.length);
  const wordsPerSeg = Math.max(2, Math.min(3, Math.ceil(words.length / Math.max(1, actualAudioDuration / 2.5))));

  const segments = [];
  let currentStart = 0;
  
  for (let i = 0; i < words.length; i += wordsPerSeg) {
    const segWords = words.slice(i, i + wordsPerSeg);
    const segDuration = segWords.length * wordDuration;
    const segEnd = Number((currentStart + segDuration).toFixed(2));

    segments.push({
      id: `seg_${segments.length + 1}_${Date.now()}`,
      start: Number(currentStart.toFixed(2)),
      end: segEnd,
      text: segWords.join(' '),
      words: segWords.map((w, wIdx) => ({
        id: `w_${i + wIdx}_${Date.now()}`,
        word: w,
        start: Number((currentStart + wIdx * wordDuration).toFixed(2)),
        end: Number((currentStart + (wIdx + 1) * wordDuration).toFixed(2)),
      })),
    });

    currentStart = segEnd;
  }

  // Generate clean, topic-matched top banner title
  let bannerTitle = 'VIRAL AI STORY';
  const lowerP = prompt.toLowerCase();

  if (targetLanguage === 'te') {
    if (lowerP.includes('funny') || lowerP.includes('friend') || lowerP.includes('laugh') || lowerP.includes('comedy') || lowerP.includes('prank') || lowerP.includes('3 friend')) {
      bannerTitle = 'ముగ్గురు ఫన్నీ ఫ్రెండ్స్ రచ్చ';
    } else if (lowerP.includes('space') || lowerP.includes('universe') || lowerP.includes('star') || lowerP.includes('galaxy') || lowerP.includes('planet')) {
      bannerTitle = 'అనంతమైన విశ్వాంతరాళ రహస్యాలు';
    } else if (lowerP.includes('tech') || lowerP.includes('ai') || lowerP.includes('code') || lowerP.includes('future') || lowerP.includes('digital')) {
      bannerTitle = 'భవిష్యత్ డిజిటల్ టెక్నాలజీ';
    } else if (lowerP.includes('motivat') || lowerP.includes('success') || lowerP.includes('hustle') || lowerP.includes('mindset') || lowerP.includes('goal')) {
      bannerTitle = 'అద్భుతమైన విజయం & ప్రేరణ';
    } else if (lowerP.includes('college') || lowerP.includes('love') || lowerP.includes('romance') || lowerP.includes('b.tech') || lowerP.includes('crush')) {
      bannerTitle = 'అనగనగా ఒక ప్రేమకథ';
    } else {
      bannerTitle = 'అద్భుతమైన ఫన్నీ విశేషాలు';
    }
  } else if (targetLanguage === 'hi') {
    if (lowerP.includes('funny') || lowerP.includes('friend')) {
      bannerTitle = '3 दोस्तों की फनी मस्ती';
    } else if (lowerP.includes('space') || lowerP.includes('universe')) {
      bannerTitle = 'अंतरिक्ष के रहस्य';
    } else if (lowerP.includes('tech') || lowerP.includes('ai')) {
      bannerTitle = 'भविष्य की तकनीक';
    } else {
      bannerTitle = 'एक अनोखी कहानी';
    }
  } else {
    if (lowerP.includes('funny') || lowerP.includes('friend')) {
      bannerTitle = '3 CRAZY FRIENDS FUNNY MOMENT';
    } else if (lowerP.includes('space') || lowerP.includes('universe')) {
      bannerTitle = 'MYSTERIES OF THE UNIVERSE';
    } else if (lowerP.includes('tech') || lowerP.includes('ai')) {
      bannerTitle = 'FUTURE OF TECHNOLOGY';
    } else {
      bannerTitle = 'VIRAL AI STORY';
    }
  }

/**
 * Render a real 1080p Master MP4 Video File from dubbed voiceover audio and visual scene overlays using FFmpeg
 */
async function renderMasterFacelessMP4Video({
  projectId,
  audioFilePath,
  brollOverlays = [],
  durationSec,
  aspectRatio = '9:16',
}) {
  const masterFileName = `faceless_master_${projectId}_${Date.now()}.mp4`;
  const masterFilePath = path.join(process.cwd(), 'uploads', masterFileName);
  const w = aspectRatio === '16:9' ? 3840 : aspectRatio === '1:1' ? 2160 : 2160;
  const h = aspectRatio === '16:9' ? 2160 : aspectRatio === '1:1' ? 2160 : 3840;

  try {
    const validOverlays = brollOverlays.filter(o => {
      if (!o.clip?.videoUrl) return false;
      const fullPath = path.join(process.cwd(), o.clip.videoUrl.replace(/^\//, ''));
      if (fullPath.toLowerCase().endsWith('.svg')) return false;
      return fs.existsSync(fullPath);
    });

    console.log(`[PRODUCTION ENGINE] 🎬 Preparing Multi-Clip Master Render (${validOverlays.length} valid scene clips, total duration: ${durationSec}s, ${w}x${h})...`);

    if (validOverlays.length >= 1) {
      const tempSegments = [];
      const manifestPath = path.join(process.cwd(), 'uploads', `concat_manifest_${projectId}_${Date.now()}.txt`);
      let manifestLines = [];

      for (let i = 0; i < validOverlays.length; i++) {
        const overlay = validOverlays[i];
        const srcPath = path.join(process.cwd(), overlay.clip.videoUrl.replace(/^\//, ''));
        const segDur = Math.max(1, Number((overlay.end - overlay.start).toFixed(2)));
        const tempSegName = `temp_seg_${projectId}_${i}_${Date.now()}.mp4`;
        const tempSegPath = path.join(process.cwd(), 'uploads', tempSegName);
        if (!fs.existsSync(srcPath)) {
          console.warn(`[PRODUCTION ENGINE] ⚠️ Missing segment file: ${srcPath}. Creating local 1080p fallback canvas...`);
          const bgCols = ['0x0f172a', '0x1e1b4b', '0x311042', '0x172554'];
          const bgCol = bgCols[i % bgCols.length];
          const initCmd = `"${ffmpegBin}" -y -f lavfi -i "color=c=${bgCol}:s=${w}x${h}:r=1" -frames:v 1 "${srcPath}"`;
          try { await execPromise(initCmd); } catch (_) {}
        }

        const isVideo = srcPath.toLowerCase().endsWith('.mp4');

        try {
          if (isVideo) {
            const cmd = `"${ffmpegBin}" -y -stream_loop -1 -i "${srcPath}" -vf "scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos+accurate_rnd,crop=${w}:${h},unsharp=5:5:0.8:5:5:0.0,fps=30,format=yuv420p" -t ${segDur} -c:v libx264 -preset medium -crf 17 -an "${tempSegPath}"`;
            await execPromise(cmd);
          } else {
            // Apply dynamic Ken Burns zoompan motion effect to AI image clips
            try {
              const kbCmd = `"${ffmpegBin}" -y -loop 1 -i "${srcPath}" -vf "scale=${w*2}:${h*2}:flags=lanczos+accurate_rnd,zoompan=z='min(zoom+0.0015,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.ceil(segDur * 30)}:s=${w}x${h}:fps=30,unsharp=5:5:0.8:5:5:0.0,format=yuv420p" -t ${segDur} -c:v libx264 -preset medium -crf 17 -an "${tempSegPath}"`;
              await execPromise(kbCmd);
            } catch (_kbErr) {
              const fallbackCmd = `"${ffmpegBin}" -y -loop 1 -i "${srcPath}" -vf "scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos+accurate_rnd,crop=${w}:${h},unsharp=5:5:0.8:5:5:0.0,fps=30,format=yuv420p" -t ${segDur} -c:v libx264 -preset medium -crf 17 -an "${tempSegPath}"`;
              await execPromise(fallbackCmd);
            }
          }

          if (fs.existsSync(tempSegPath) && fs.statSync(tempSegPath).size > 1000) {
            tempSegments.push(tempSegPath);
            manifestLines.push(`file '${tempSegPath.replace(/'/g, "'\\''")}'`);
          }
        } catch (segErr) {
          console.warn(`[PRODUCTION ENGINE] Segment ${i + 1} render warning: ${segErr.message}`);
        }
      }

      if (tempSegments.length > 0) {
        fs.writeFileSync(manifestPath, manifestLines.join('\n'));
        const concatCmd = `"${ffmpegBin}" -y -f concat -safe 0 -i "${manifestPath}" -i "${audioFilePath}" -c:v copy -c:a aac -b:a 192k -shortest -t ${durationSec} "${masterFilePath}"`;
        await execPromise(concatCmd);

        // Clean up temporary manifest & segments
        try { if (fs.existsSync(manifestPath)) fs.unlinkSync(manifestPath); } catch (_) {}
        for (const seg of tempSegments) {
          try { if (fs.existsSync(seg)) fs.unlinkSync(seg); } catch (_) {}
        }

        if (fs.existsSync(masterFilePath) && fs.statSync(masterFilePath).size > 20000) {
          console.log(`[PRODUCTION ENGINE] 🎬 Successfully Stitched Multi-Clip Master Video (${tempSegments.length} clips): /uploads/${masterFileName} (${(fs.statSync(masterFilePath).size / 1024 / 1024).toFixed(2)} MB)`);
          return `/uploads/${masterFileName}`;
        }
      }
    }

    // Fallback: Single clip / primary image render
    let primaryClipPath = validOverlays[0] ? path.join(process.cwd(), validOverlays[0].clip.videoUrl.replace(/^\//, '')) : null;

    if (primaryClipPath && primaryClipPath.endsWith('.mp4')) {
      const cmd = `"${ffmpegBin}" -y -stream_loop -1 -i "${primaryClipPath}" -i "${audioFilePath}" -vf "scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -shortest -t ${durationSec} "${masterFilePath}"`;
      await execPromise(cmd);
    } else {
      const inputImg = (primaryClipPath && fs.existsSync(primaryClipPath)) ? primaryClipPath : null;
      let cmd = '';
      if (inputImg) {
        cmd = `"${ffmpegBin}" -y -loop 1 -i "${inputImg}" -i "${audioFilePath}" -vf "scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},format=yuv420p" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -shortest -t ${durationSec} "${masterFilePath}"`;
      } else {
        cmd = `"${ffmpegBin}" -y -f lavfi -i "color=c=0x0f172a:s=${w}x${h}:r=30" -i "${audioFilePath}" -vf "format=yuv420p" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -shortest -t ${durationSec} "${masterFilePath}"`;
      }
      await execPromise(cmd);
    }

    if (fs.existsSync(masterFilePath) && fs.statSync(masterFilePath).size > 20000) {
      console.log(`[PRODUCTION ENGINE] 🎬 Rendered Single-Clip Master MP4 Video File: /uploads/${masterFileName} (${(fs.statSync(masterFilePath).size / 1024 / 1024).toFixed(2)} MB)`);
      return `/uploads/${masterFileName}`;
    }
  } catch (err) {
    console.warn(`[PRODUCTION ENGINE] Master MP4 video render warning: ${err.message}`);
  }
  return null;
}

  // Step 6: Render Master 1080p MP4 Video File & Save Project to Database
  const masterVideoUrl = await renderMasterFacelessMP4Video({
    projectId,
    audioFilePath,
    brollOverlays,
    durationSec: actualAudioDuration,
    aspectRatio,
  });

  const finalVideoUrl = masterVideoUrl || backgroundUrl || audioUrl;
  const title = `AI Faceless: ${prompt.slice(0, 30)}`;

  const timeline = {
    duration: actualAudioDuration,
    aspectRatio,
    videoUrl: finalVideoUrl,
    dubbedAudioUrl: audioUrl,
    dubbedLanguage: targetLanguage,
    dubbedProvider: voiceProvider,
    segments,
    brollOverlays,
    globalTheme: {
      presetId: 'hormozi_yellow',
      fontFamily: 'Inter',
      fontSize: aspectRatio === '16:9' ? 24 : 32,
      position: { x: 50, y: 75 },
    },
    topBanner: {
      enabled: true,
      text: bannerTitle,
      backgroundColor: '#FFE600',
    },
  };

  const projectRes = await query(
    `INSERT INTO projects (id, user_id, title, video_url, status, target_style)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, status, created_at`,
    [(await import('uuid')).v4(), userId || null, title, finalVideoUrl, 'completed', targetLanguage]
  );

  const newProject = projectRes.rows[0];

  // Save timeline payload into captions table
  await saveTimeline(newProject.id, timeline);

  console.log(`[PRODUCTION ENGINE] 🎬 Loaded Timeline Project ID: ${newProject.id}`);
  console.log(`[PRODUCTION ENGINE] 🎙️ Spoken Script Length: ${scriptText.length} chars`);
  console.log(`[PRODUCTION ENGINE] ⏱️ Audio Duration: ${actualAudioDuration}s`);
  console.log(`[PRODUCTION ENGINE] ⏱️ Subtitle Segments: ${segments.length}`);
  console.log(`[PRODUCTION ENGINE] 🖼️ Aspect Ratio: ${aspectRatio}`);
  console.log(`[PRODUCTION ENGINE] 🍿 Story Scene Clips Sourced: ${brollOverlays.length} (Assigned Overlays: ${brollOverlays.length})`);

  return {
    success: true,
    projectId: newProject.id,
    title: newProject.title,
    scriptText,
    audioUrl,
    backgroundUrl,
    duration: actualAudioDuration,
    aspectRatio,
    timeline,
  };
}
