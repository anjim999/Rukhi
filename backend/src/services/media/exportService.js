import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { query } from '../../db/pool.js';
import { config } from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';

const ffprobePath = ffprobeStatic.path;

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const bin = ffmpegPath || 'ffmpeg';
    console.log(`[FFMPEG EXPORT BIN] Executing: ${bin} ${args.slice(0, 6).join(' ')}...`);
    const process = spawn(bin, args);
    let stderr = '';

    process.stderr.on('data', (data) => { stderr += data.toString(); });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        console.error(`[FFMPEG EXPORT ERROR STDOUT]:\n${stderr}`);
        const errTail = stderr.length > 800 ? stderr.slice(-800) : stderr;
        reject(new Error(`FFmpeg 60fps Export failed (code ${code}): ${errTail}`));
      }
    });

    process.on('error', (err) => { reject(err); });
  });
}

function convertTimelineToSRT(timeline) {
  if (!timeline?.segments || timeline.segments.length === 0) {
    return '';
  }

  let srtContent = '';
  let counter = 1;

  function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    const pad = (n, width = 2) => String(n).padStart(width, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
  }

  for (const seg of timeline.segments) {
    const text = (seg.words && seg.words.length > 0)
      ? seg.words.map((w) => w.word).join(' ')
      : (seg.text || '');
    if (!text || !text.trim()) continue;

    const startSec = Math.max(0, seg.start || 0);
    const endSec = Math.max(startSec + 0.5, seg.end || (startSec + 1));
    const startTime = formatTime(startSec);
    const endTime = formatTime(endSec);

    srtContent += `${counter}\n${startTime} --> ${endTime}\n${text.trim()}\n\n`;
    counter++;
  }

  return srtContent;
}

function getSanitizedFilename(title) {
  if (!title || !title.trim()) return `reel_${Date.now()}.mp4`;
  let clean = title.trim();
  clean = clean.replace(/\.(mp4|mov|webm|m4v|avi|mkv)$/i, '');
  clean = clean.replace(/[^\w\s\-\.]/g, '').trim().replace(/\s+/g, '_');
  if (!clean) return `reel_${Date.now()}.mp4`;
  return `${clean}.mp4`;
}

export async function renderProjectVideoMP4(projectId, quality = '1080p') {
  // Fetch project details
  const projRes = await query(`SELECT * FROM projects WHERE id = $1`, [projectId]);
  if (projRes.rows.length === 0) {
    throw new AppError('Project not found.', 404);
  }
  const project = projRes.rows[0];

  // Fetch timeline JSON
  const capRes = await query(`SELECT timeline_json FROM captions WHERE project_id = $1`, [projectId]);
  if (capRes.rows.length === 0 || !capRes.rows[0].timeline_json) {
    throw new AppError('Caption timeline not ready. Please wait for AI analysis to complete.', 400);
  }
  const timeline = capRes.rows[0].timeline_json;

  // Resolve input video file path
  let relativePath = project.video_url.replace(/\\/g, '/');
  const uploadsIdx = relativePath.indexOf('uploads/');
  if (uploadsIdx !== -1) {
    relativePath = relativePath.substring(uploadsIdx);
  }
  const filename = path.basename(relativePath);
  const inputVideoPath = path.join(config.uploadDir, filename);

  if (!fs.existsSync(inputVideoPath)) {
    throw new AppError(`Input video file not found on server at: ${inputVideoPath}`, 404);
  }

  // Generate SRT file
  const srtFileName = `${projectId}_subtitles.srt`;
  const srtFilePath = path.join(config.outputDir, srtFileName);
  const srtData = convertTimelineToSRT(timeline);
  fs.writeFileSync(srtFilePath, srtData, 'utf-8');

  // Output MP4 file
  const outputFileName = `export_${projectId}_${quality}.mp4`;
  const outputFilePath = path.join(config.outputDir, outputFileName);
  const userDownloadName = getSanitizedFilename(project.title);

  // Escaped SRT path for FFmpeg subtitles filter
  const escapedSrtPath = srtFilePath.replace(/\\/g, '/').replace(/:/g, '\\:');
  const targetFont = (timeline.globalTheme?.fontFamily || 'Montserrat').replace(/[^\w\s]/g, '');

  const qualitySpecs = {
    '480p': { scale: 'scale=-2:854', font: 18, maxrate: '5M', bufsize: '10M' },
    '720p': { scale: 'scale=-2:1280', font: 22, maxrate: '10M', bufsize: '20M' },
    '1080p': { scale: 'scale=-2:1920', font: 26, maxrate: '20M', bufsize: '40M' },
    '2K': { scale: 'scale=-2:2560', font: 36, maxrate: '35M', bufsize: '70M' },
    '4K': { scale: 'scale=-2:3840', font: 52, maxrate: '60M', bufsize: '120M' },
  };
  const spec = qualitySpecs[quality] || qualitySpecs['1080p'];
  
  // Multiply resolution base font size by user's custom font size setting in editor (default 52)
  const userChosenFontSize = timeline.globalTheme?.fontSize || 52;
  const userScaleRatio = userChosenFontSize / 52;
  const finalFontSize = Math.max(12, Math.round(spec.font * userScaleRatio));

  const forceStyle = `FontName=${targetFont},FontSize=${finalFontSize},PrimaryColour=&H0005FACC,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=1,MarginV=45,Alignment=2,Bold=1`;

  console.log(`[FFMPEG EXPORT ${quality}] Burning subtitles into Ultra-HD ${quality} video for project ${projectId} (${userDownloadName})...`);

  await runFFmpeg([
    '-i', inputVideoPath,
    '-vf', `scale=trunc(iw/2)*2:trunc(ih/2)*2,subtitles=${escapedSrtPath}:force_style='${forceStyle}'`,
    '-r', '30',
    '-c:v', 'libx264',
    '-preset', 'superfast',
    '-threads', '0',
    '-crf', '18',
    '-maxrate', spec.maxrate,
    '-bufsize', spec.bufsize,
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '44100',
    '-ac', '2',
    '-movflags', '+faststart',
    '-y',
    outputFilePath,
  ]);

  console.log(`[FFMPEG EXPORT ${quality}] ✅ Render complete: ${outputFilePath}`);

  const outputUrl = `/outputs/${outputFileName}`;
  return {
    outputUrl,
    filename: userDownloadName,
  };
}

export async function remuxRecordedBlobToInstaMP4(inputFilePath, userTitle = 'reel') {
  const outputFileName = `insta_ready_${Date.now()}.mp4`;
  const outputFilePath = path.join(config.outputDir, outputFileName);
  const userDownloadName = getSanitizedFilename(userTitle);

  console.log(`[FFMPEG INSTA REMUX] Packaging recorded stream for Instagram Reels (+faststart): ${inputFilePath}`);

  await runFFmpeg([
    '-i', inputFilePath,
    '-c:v', 'libx264',
    '-preset', 'superfast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '44100',
    '-ac', '2',
    '-movflags', '+faststart',
    '-y',
    outputFilePath,
  ]);

  console.log(`[FFMPEG INSTA REMUX] ✅ Packaging complete: ${outputFilePath}`);

  const outputUrl = `/outputs/${outputFileName}`;
  return {
    outputUrl,
    filename: userDownloadName,
  };
}
