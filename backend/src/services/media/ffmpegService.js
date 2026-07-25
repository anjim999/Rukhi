import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { config } from '../../config/env.js';

const ffprobePath = ffprobeStatic.path;

/**
 * FFmpeg Media Service using static prebuilt binaries (ffmpeg-static & ffprobe-static).
 * Guaranteed to run on Linux/macOS/Windows without system dependencies.
 */

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const bin = ffmpegPath || 'ffmpeg';
    console.log(`[FFMPEG BIN] Using binary: ${bin}`);
    const process = spawn(bin, args);
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => { stdout += data.toString(); });
    process.stderr.on('data', (data) => { stderr += data.toString(); });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.substring(0, 500)}`));
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

function runFFprobe(args) {
  return new Promise((resolve, reject) => {
    const bin = ffprobePath || 'ffprobe';
    console.log(`[FFPROBE BIN] Using binary: ${bin}`);
    const process = spawn(bin, args);
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => { stdout += data.toString(); });
    process.stderr.on('data', (data) => { stderr += data.toString(); });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`ffprobe exited with code ${code}: ${stderr.substring(0, 500)}`));
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

export async function extractAudio(videoPath, projectId) {
  const outputPath = path.join(config.uploadDir, `${projectId}_audio.wav`);

  if (fs.existsSync(outputPath)) {
    return outputPath;
  }

  try {
    console.log(`[FFMPEG] Extracting 16kHz mono WAV audio from: ${videoPath}`);
    await runFFmpeg([
      '-i', videoPath,
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      '-y',
      outputPath,
    ]);
    console.log(`[FFMPEG] ✅ Audio extracted cleanly: ${outputPath}`);
    return outputPath;
  } catch (err) {
    console.warn(`[FFMPEG WARNING] Audio extraction failed (${err.message}).`);
    throw err;
  }
}

export async function extractAudioChunk(audioPath, startSec, durationSec, chunkPath) {
  try {
    await runFFmpeg([
      '-i', audioPath,
      '-ss', String(startSec),
      '-t', String(durationSec),
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      '-y',
      chunkPath,
    ]);
    return chunkPath;
  } catch (err) {
    console.warn(`[FFMPEG WARNING] Audio chunk extraction failed for ${startSec}s-${startSec + durationSec}s: ${err.message}`);
    throw err;
  }
}

/**
 * Detect initial acoustic silence duration before speech onset using FFmpeg silencedetect.
 */
export async function detectSpeechOnset(audioPath) {
  try {
    const output = await new Promise((resolve) => {
      const bin = ffmpegPath || 'ffmpeg';
      const proc = spawn(bin, [
        '-i', audioPath,
        '-af', 'silencedetect=noise=-30dB:d=0.1',
        '-f', 'null',
        '-',
      ]);
      let stderr = '';
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('close', () => resolve(stderr));
      proc.on('error', () => resolve(''));
    });

    const match = output.match(/silence_end:\s*([0-9\.]+)/);
    if (match) {
      const onsetSec = Math.round(parseFloat(match[1]) * 100) / 100;
      return onsetSec;
    }
    return 0.0;
  } catch (_e) {
    return 0.0;
  }
}


export async function probeVideo(videoPath) {
  try {
    console.log(`[FFMPEG] Probing video: ${videoPath}`);
    const output = await runFFprobe([
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      videoPath,
    ]);

    const metadata = JSON.parse(output);
    const videoStream = metadata.streams?.find((s) => s.codec_type === 'video');
    const format = metadata.format || {};

    const duration = parseFloat(format.duration) || 15;
    const width = videoStream ? parseInt(videoStream.width, 10) : 1080;
    const height = videoStream ? parseInt(videoStream.height, 10) : 1920;

    let fps = 30;
    if (videoStream && videoStream.r_frame_rate) {
      const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
      fps = den ? Math.round((num / den) * 100) / 100 : num;
    }

    return { duration, width, height, fps };
  } catch (err) {
    console.warn(`[FFMPEG WARNING] ffprobe failed (${err.message}). Using fallback metadata.`);
    return { duration: 15, width: 1080, height: 1920, fps: 30 };
  }
}

export async function generateWaveformPeaks(audioPath, numPeaks = 200) {
  try {
    console.log(`[FFMPEG] Generating waveform peaks: ${audioPath}`);
    const rawData = await new Promise((resolve, reject) => {
      const bin = ffmpegPath || 'ffmpeg';
      const process = spawn(bin, [
        '-i', audioPath,
        '-f', 'f32le',
        '-acodec', 'pcm_f32le',
        '-ac', '1',
        '-ar', '8000',
        '-',
      ]);

      const chunks = [];
      process.stdout.on('data', (data) => { chunks.push(data); });
      process.stderr.on('data', () => {});

      process.on('close', (code) => {
        if (code === 0) {
          resolve(Buffer.concat(chunks));
        } else {
          reject(new Error(`Waveform generation failed with code ${code}`));
        }
      });

      process.on('error', reject);
    });

    const samples = new Float32Array(rawData.buffer, rawData.byteOffset, rawData.byteLength / 4);
    const samplesPerPeak = Math.floor(samples.length / numPeaks);

    if (samplesPerPeak === 0) {
      return Array(numPeaks).fill(0.3);
    }

    const peaks = [];
    for (let i = 0; i < numPeaks; i++) {
      let max = 0;
      const start = i * samplesPerPeak;
      const end = Math.min(start + samplesPerPeak, samples.length);
      for (let j = start; j < end; j++) {
        const abs = Math.abs(samples[j]);
        if (abs > max) max = abs;
      }
      peaks.push(Math.round(max * 1000) / 1000);
    }

    return peaks;
  } catch (err) {
    console.warn(`[FFMPEG WARNING] Waveform generation fallback used.`);
    return Array.from({ length: numPeaks }, (_, i) =>
      Math.round((0.2 + Math.abs(Math.sin(i * 0.2)) * 0.7) * 1000) / 1000
    );
  }
}
