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
        reject(new Error(`FFmpeg 60fps Export failed (code ${code}): ${stderr.substring(0, 500)}`));
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
    if (!seg.words || seg.words.length === 0) continue;
    const startTime = formatTime(seg.start);
    const endTime = formatTime(seg.end);
    const text = seg.words.map((w) => w.word.toUpperCase()).join(' ');

    srtContent += `${counter}\n${startTime} --> ${endTime}\n${text}\n\n`;
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

export async function renderProjectVideoMP4(projectId) {
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
  const outputFileName = `export_${projectId}_60fps.mp4`;
  const outputFilePath = path.join(config.outputDir, outputFileName);
  const userDownloadName = getSanitizedFilename(project.title);

  // Escaped SRT path for FFmpeg subtitles filter
  const escapedSrtPath = srtFilePath.replace(/\\/g, '/').replace(/:/g, '\\:');
  const forceStyle = "FontName=Arial,FontSize=22,PrimaryColour=&H0005FACC,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=1,MarginV=45,Alignment=2,Bold=1";

  console.log(`[FFMPEG INSTAGRAM REEL EXPORT] Burning subtitles into Ultra-HD MP4 video for project ${projectId} (${userDownloadName})...`);

  await runFFmpeg([
    '-i', inputVideoPath,
    '-vf', `subtitles='${escapedSrtPath}':force_style='${forceStyle}'`,
    '-r', '30',
    '-c:v', 'libx264',
    '-profile:v', 'baseline',
    '-level', '3.1',
    '-preset', 'superfast',
    '-threads', '0',
    '-crf', '18',
    '-maxrate', '15M',
    '-bufsize', '30M',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '44100',
    '-ac', '2',
    '-movflags', '+faststart',
    '-y',
    outputFilePath,
  ]);

  console.log(`[FFMPEG 60FPS EXPORT] ✅ Render complete: ${outputFilePath}`);

  const outputUrl = `/outputs/${outputFileName}`;
  return {
    outputUrl,
    filename: userDownloadName,
  };
}
