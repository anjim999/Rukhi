import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { query } from '../../db/pool.js';
import { config } from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';

const ffprobePath = ffprobeStatic.path;

const exportProgressMap = new Map();
const activeFFmpegProcesses = new Map();

export function getProgressForProject(projectId) {
  return exportProgressMap.get(String(projectId)) || { percent: 0, currentSec: 0, totalDuration: 0, status: 'idle' };
}

export function cancelFFmpegExport(projectId) {
  const pId = String(projectId);
  if (activeFFmpegProcesses.has(pId)) {
    const proc = activeFFmpegProcesses.get(pId);
    try {
      proc.kill('SIGKILL');
      console.log(`[FFMPEG EXPORT CANCEL] 🛑 Instantly killed active FFmpeg export process for project ${pId}`);
    } catch (_e) {}
    activeFFmpegProcesses.delete(pId);
    exportProgressMap.set(pId, { percent: 0, currentSec: 0, totalDuration: 0, status: 'cancelled' });
    return true;
  }
  exportProgressMap.delete(pId);
  return false;
}

function runFFmpeg(args, options = {}) {
  return new Promise((resolve, reject) => {
    const bin = ffmpegPath || 'ffmpeg';
    const fullArgs = ['-progress', 'pipe:1', ...args];
    console.log(`[FFMPEG EXPORT BIN] Executing: ${bin} ${fullArgs.slice(0, 8).join(' ')}...`);
    const process = spawn(bin, fullArgs);
    let stderr = '';

    if (options.projectId) {
      activeFFmpegProcesses.set(String(options.projectId), process);
    }

    if (process.stdout) {
      process.stdout.on('data', (data) => {
        const str = data.toString();
        const usMatch = str.match(/out_time_us=(\d+)/);
        const timeMatch = str.match(/out_time=(\d{2}:\d{2}:\d{2}\.\d+)/);
        let currentSec = 0;

        if (usMatch && usMatch[1]) {
          currentSec = parseInt(usMatch[1], 10) / 1000000;
        } else if (timeMatch && timeMatch[1]) {
          const parts = timeMatch[1].split(':');
          if (parts.length === 3) {
            currentSec = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
          }
        }

        if (options.onProgress && currentSec > 0) {
          options.onProgress(currentSec);
        }
      });
    }

    process.stderr.on('data', (data) => { stderr += data.toString(); });

    process.on('close', (code) => {
      if (options.projectId) {
        activeFFmpegProcesses.delete(String(options.projectId));
      }
      if (code === 0) {
        resolve(true);
      } else if (code === null || process.killed) {
        const cancelErr = new Error('EXPORT_CANCELLED');
        cancelErr.isCancelled = true;
        reject(cancelErr);
      } else {
        console.error(`[FFMPEG EXPORT ERROR STDOUT]:\n${stderr}`);
        const errTail = stderr.length > 800 ? stderr.slice(-800) : stderr;
        reject(new Error(`FFmpeg 30fps H.264 Export failed (code ${code}): ${errTail}`));
      }
    });

    process.on('error', (err) => {
      if (options.projectId) {
        activeFFmpegProcesses.delete(String(options.projectId));
      }
      reject(err);
    });
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

export async function renderProjectVideoMP4(projectId, requestedQuality = '1080p') {
  // Fetch project details
  const projRes = await query(`SELECT * FROM projects WHERE id = $1`, [projectId]);
  if (projRes.rows.length === 0) {
    throw new AppError('Project not found.', 404);
  }
  const project = projRes.rows[0];

  const effectiveQuality = ['480p', '720p', '1080p', '2K', '4K'].includes(requestedQuality)
    ? requestedQuality
    : '1080p';

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

  // Ensure output directory exists before writing files
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  // Check for dubbed voiceover track in timeline
  let audioInputArgs = ['-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-ac', '2'];
  let additionalInputs = [];
  if (timeline?.dubbedAudioUrl) {
    let dubbedPath = timeline.dubbedAudioUrl.replace(/\\/g, '/');
    const uIdx = dubbedPath.indexOf('uploads/');
    if (uIdx !== -1) dubbedPath = dubbedPath.substring(uIdx);
    const dubbedFullPath = path.join(config.uploadDir, path.basename(dubbedPath));
    if (fs.existsSync(dubbedFullPath)) {
      additionalInputs = ['-i', dubbedFullPath, '-map', '0:v:0', '-map', '1:a:0'];
    }
  }

  // Generate SRT file
  const srtFileName = `${projectId}_subtitles.srt`;
  const srtFilePath = path.join(config.outputDir, srtFileName);
  const srtData = convertTimelineToSRT(timeline);
  fs.writeFileSync(srtFilePath, srtData, 'utf-8');

  // Output MP4 file
  const outputFileName = `export_${projectId}_${effectiveQuality}.mp4`;
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
    '4K': { scale: 'scale=-2:3840', font: 48, maxrate: '50M', bufsize: '100M' },
  };
  const spec = qualitySpecs[effectiveQuality] || qualitySpecs['1080p'];
  
  const userChosenFontSize = timeline.globalTheme?.fontSize || 52;
  const userScaleRatio = userChosenFontSize / 52;
  const finalFontSize = Math.max(12, Math.round(spec.font * userScaleRatio));

  const forceStyle = `FontName=${targetFont},FontSize=${finalFontSize},PrimaryColour=&H0005FACC,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=1,MarginV=45,Alignment=2,Bold=1`;

  const ffmpegArgs = [
    '-i', inputVideoPath,
    ...additionalInputs,
    '-vf', `${spec.scale}:flags=bicubic,subtitles=${escapedSrtPath}:force_style='${forceStyle}'`,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-r', '30',
    '-g', '30',
    '-keyint_min', '30',
    '-sc_threshold', '0',
    '-pix_fmt', 'yuv420p',
    '-maxrate', spec.maxrate,
    '-bufsize', spec.bufsize,
    ...audioInputArgs,
    '-movflags', '+faststart',
    '-y',
    outputFilePath,
  ];

  const totalDur = Math.max(5, parseFloat(timeline?.duration || project?.duration || 30));
  exportProgressMap.set(String(projectId), { percent: 1, currentSec: 0, totalDuration: totalDur, status: 'rendering' });

  try {
    await runFFmpeg(ffmpegArgs, {
      projectId,
      onProgress: (currentSec) => {
        const pct = Math.min(99, Math.max(1, Math.round((currentSec / totalDur) * 100)));
        exportProgressMap.set(String(projectId), {
          percent: pct,
          currentSec: Math.min(currentSec, totalDur),
          totalDuration: totalDur,
          status: 'rendering',
        });
      },
    });
    exportProgressMap.set(String(projectId), { percent: 100, currentSec: totalDur, totalDuration: totalDur, status: 'completed' });
  } catch (err) {
    if (err.isCancelled || err.message === 'EXPORT_CANCELLED') {
      console.log(`[FFMPEG EXPORT CANCEL] 🛑 Cleanly handled export cancellation for project ${projectId}`);
      exportProgressMap.set(String(projectId), { percent: 0, currentSec: 0, totalDuration: totalDur, status: 'cancelled' });
      return { outputUrl: null, cancelled: true };
    }
    exportProgressMap.set(String(projectId), { percent: 0, currentSec: 0, totalDuration: totalDur, status: 'failed', error: err.message });
    throw err;
  }

  console.log(`[FFMPEG EXPORT ${effectiveQuality}] ✅ Server-side broadcast render complete: ${outputFilePath}`);

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

  const outputDir = path.dirname(outputFilePath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const resolvedInputPath = path.isAbsolute(inputFilePath)
    ? inputFilePath
    : path.resolve(process.cwd(), inputFilePath);

  if (!fs.existsSync(resolvedInputPath)) {
    console.error(`[FFMPEG REMUX ERROR] Input file not found at: ${resolvedInputPath}`);
    throw new AppError(`Uploaded video stream file not found at ${inputFilePath}`, 400);
  }

  console.log(`[FFMPEG INSTA REMUX] Packaging recorded stream for Instagram Reels (+faststart): ${resolvedInputPath}`);

  try {
    // Primary attempt: Remux video + audio with H.264 + AAC
    await runFFmpeg([
      '-analyzeduration', '20M',
      '-probesize', '20M',
      '-i', resolvedInputPath,
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p',
      '-c:v', 'libx264',
      '-preset', 'superfast',
      '-crf', '18',
      '-r', '30',
      '-g', '30',
      '-keyint_min', '30',
      '-sc_threshold', '0',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-max_muxing_queue_size', '4096',
      '-movflags', '+faststart',
      '-y',
      outputFilePath,
    ]);
  } catch (primaryErr) {
    console.warn(`[FFMPEG INSTA REMUX WARN] Primary remux with audio failed (${primaryErr.message}). Attempting video-only remux fallback...`);
    // Secondary fallback: Remux video-only if input file has no audio stream
    await runFFmpeg([
      '-analyzeduration', '20M',
      '-probesize', '20M',
      '-i', resolvedInputPath,
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p',
      '-c:v', 'libx264',
      '-preset', 'superfast',
      '-crf', '18',
      '-r', '30',
      '-pix_fmt', 'yuv420p',
      '-an',
      '-movflags', '+faststart',
      '-y',
      outputFilePath,
    ]);
  }

  console.log(`[FFMPEG INSTA REMUX] ✅ Packaging complete: ${outputFilePath}`);

  const outputUrl = `/outputs/${outputFileName}`;
  return {
    outputUrl,
    filename: userDownloadName,
  };
}
