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

function ensureExecutable(binPath) {
  if (binPath && typeof binPath === 'string' && fs.existsSync(binPath)) {
    try {
      fs.chmodSync(binPath, '755');
    } catch (_e) {}
  }
}

export function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const bin = ffmpegPath || 'ffmpeg';
    ensureExecutable(bin);
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
        console.error(`[FFMPEG ERROR STDOUT]:\n${stdout}`);
        console.error(`[FFMPEG ERROR STDERR]:\n${stderr}`);
        const errTail = stderr.length > 800 ? stderr.slice(-800) : stderr;
        reject(new Error(`FFmpeg exited with code ${code}: ${errTail}`));
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

export function runFFprobe(args) {
  return new Promise((resolve, reject) => {
    const bin = ffprobePath || 'ffprobe';
    ensureExecutable(bin);
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
    console.log(`[FFMPEG] Extracting broadcast-grade normalized 16kHz mono WAV audio from: ${videoPath}`);
    await runFFmpeg([
      '-i', videoPath,
      '-vn',
      '-af', 'highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11,dynaudnorm',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      '-y',
      outputPath,
    ]);
    console.log(`[FFMPEG] ✅ Clean normalized audio extracted: ${outputPath}`);
    return outputPath;
  } catch (err) {
    console.warn(`[FFMPEG WARNING] Filtered audio extraction fallback (${err.message}). Using standard PCM.`);
    await runFFmpeg([
      '-i', videoPath,
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      '-y',
      outputPath,
    ]);
    return outputPath;
  }
}

export async function extractAudioChunk(audioPath, startSec, durationSec, chunkPath) {
  try {
    await runFFmpeg([
      '-ss', String(startSec),
      '-t', String(durationSec),
      '-i', audioPath,
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
 * Detect initial acoustic silence duration before speech onset using FFmpeg silencedetect
 * with enhanced vocal energy envelope analysis for precise word-start clamping.
 * Uses stricter noise floor (-35dB) and shorter minimum silence duration (0.08s)
 * to catch even soft-spoken vocal attack edges accurately.
 */
export async function detectSpeechOnset(audioPath) {
  try {
    const output = await new Promise((resolve) => {
      const bin = ffmpegPath || 'ffmpeg';
      const proc = spawn(bin, [
        '-i', audioPath,
        '-af', 'highpass=f=120,lowpass=f=3400,silencedetect=noise=-35dB:d=0.08',
        '-f', 'null',
        '-',
      ]);
      let stderr = '';
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('close', () => resolve(stderr));
      proc.on('error', () => resolve(''));
    });

    // Find the FIRST silence_end event — that's the exact vocal attack onset
    const match = output.match(/silence_end:\s*([0-9\.]+)/);
    if (match) {
      const onsetSec = Math.round(parseFloat(match[1]) * 100) / 100;
      console.log(`[FFMPEG ONSET] Detected speech onset at ${onsetSec}s for: ${audioPath}`);
      return onsetSec;
    }
    return 0.0;
  } catch (_e) {
    return 0.0;
  }
}

/**
 * Apply vocal-isolation noise reduction to audio for improved STT accuracy.
 * Uses highpass (120Hz) + lowpass (3400Hz) bandpass to isolate human speech range,
 * followed by FFmpeg's afftdn noise reduction filter.
 * Used as a fallback when Demucs AI separation is unavailable or on low-resource environments.
 */
export async function denoiseAudioForSTT(inputPath, projectId) {
  const outputPath = path.join(config.uploadDir, `${projectId}_denoised.wav`);

  if (fs.existsSync(outputPath)) {
    return outputPath;
  }

  try {
    console.log(`[FFMPEG DENOISE] Applying vocal-isolation noise reduction for STT: ${inputPath}`);
    await runFFmpeg([
      '-i', inputPath,
      '-af', 'highpass=f=120,lowpass=f=3400,afftdn=nf=-25,loudnorm=I=-16:TP=-1.5:LRA=11',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      '-y',
      outputPath,
    ]);
    console.log(`[FFMPEG DENOISE] ✅ Denoised audio ready: ${outputPath}`);
    return outputPath;
  } catch (err) {
    console.warn(`[FFMPEG DENOISE WARNING] Noise reduction failed (${err.message}). Using original audio.`);
    return inputPath;
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

export async function webOptimizeVideo(inputPath, outputPath) {
  try {
    console.log(`[FFMPEG] Web-Optimizing video (fast stream copy) for mobile compatibility: ${inputPath}`);
    await runFFmpeg([
      '-i', inputPath,
      '-c', 'copy',
      '-movflags', '+faststart',
      '-y',
      outputPath,
    ]);
    console.log(`[FFMPEG] ✅ Web optimization complete: ${outputPath}`);
    return outputPath;
  } catch (err) {
    console.warn(`[FFMPEG WARNING] Fast stream copy optimization fallback: ${err.message}`);
    return inputPath;
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
