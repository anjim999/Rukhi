import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

function run(bin, args, { wantStderr = false } = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve(wantStderr ? stderr : stdout);
      else reject(new Error(`${bin.includes('ffprobe') ? 'ffprobe' : 'ffmpeg'} exited with code ${code}: ${stderr.slice(-800)}`));
    });
  });
}

export function ffmpeg(args) {
  return run(ffmpegPath, ['-hide_banner', '-y', ...args]);
}

export async function probe(file) {
  const out = await run(ffprobeStatic.path, ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', file]);
  const info = JSON.parse(out);
  const streams = info.streams || [];
  return {
    duration: parseFloat(info.format?.duration || '0'),
    hasAudio: streams.some((s) => s.codec_type === 'audio'),
    hasVideo: streams.some((s) => s.codec_type === 'video'),
  };
}

/** Pixel size of an image or video. */
export async function pixelSize(file) {
  const out = await run(ffprobeStatic.path, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]);
  const [width, height] = out.trim().split(',').map(Number);
  return { width, height };
}

export function frameSize(aspectRatio, resolution) {
  const short = resolution === '1080p' ? 1080 : 720;
  const long = Math.round((short * 16) / 9);
  if (aspectRatio === '9:16') return { w: short, h: long };
  if (aspectRatio === '1:1') return { w: short, h: short };
  return { w: long, h: short };
}

/** Scale-and-crop any image to exactly the film frame, as JPEG. */
export function fitImageToFrame(input, output, { w, h }) {
  return ffmpeg(['-i', input, '-vf', `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`, '-frames:v', '1', '-q:v', '2', output]);
}

/**
 * Re-encode a clip to the film's common format (size, 24 fps, H.264, 48 kHz stereo AAC,
 * loudness-normalised) so clips can be joined without re-encoding. Silent clips get a silent track.
 */
export async function normalizeClip(input, output, { w, h }, { trimSec, loudnorm = true, gain = 1 } = {}) {
  const { hasAudio } = await probe(input);
  const vf = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,fps=24,format=yuv420p`;
  const video = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18'];
  const audio = ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2'];
  // trimSec keeps only the start of a clip: Veo renders 4, 6 or 8 seconds, the edit may want less.
  const trim = trimSec ? ['-t', String(trimSec)] : [];
  if (hasAudio) {
    // Loudness-normalising is for dialogue. Applied to a shot with only room sound it would lift
    // that ambience to speech level, so those shots get a fixed gain instead.
    const af = loudnorm ? ['-af', 'loudnorm=I=-16:TP=-1.5:LRA=11'] : gain !== 1 ? ['-af', `volume=${gain}`] : [];
    return ffmpeg(['-i', input, '-vf', vf, ...af, ...video, ...audio, ...trim, output]);
  }
  return ffmpeg(['-i', input, '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-vf', vf, ...video, ...audio, ...(trimSec ? trim : ['-shortest']), output]);
}

/**
 * Find where the sound in a clip's audio starts and ends, in seconds. Used to place a dubbed
 * line where the character's mouth is moving. Returns null when the audio is never quiet
 * (constant ambience), because then the track says nothing about when speech happens.
 */
export async function detectSoundWindow(file, duration) {
  const log = await run(ffmpegPath, ['-hide_banner', '-i', file, '-vn', '-af', 'silencedetect=noise=-32dB:d=0.2', '-f', 'null', '-'], { wantStderr: true });
  const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => parseFloat(m[1]));
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => parseFloat(m[1]));
  if (!starts.length) return null;

  // Leading silence ends where sound begins; trailing silence starts where it stops.
  const start = starts[0] <= 0.05 && ends.length ? ends[0] : 0;
  const lastStart = starts[starts.length - 1];
  const trailing = ends.length < starts.length || ends[ends.length - 1] >= duration - 0.05;
  const end = trailing ? lastStart : duration;
  return end - start > 0.3 ? { start, end } : null;
}

/** Join spoken lines into one WAV with a short pause between them. */
export function joinSpeech(files, output, { gapSec = 0.25 } = {}) {
  if (files.length === 1) return ffmpeg(['-i', files[0], '-ar', '48000', '-ac', '1', output]);
  const inputs = files.flatMap((f) => ['-i', f]);
  const padded = files.map((_, i) => `[${i}:a]aresample=48000,apad=pad_dur=${i < files.length - 1 ? gapSec : 0}[s${i}]`).join(';');
  const graph = `${padded};${files.map((_, i) => `[s${i}]`).join('')}concat=n=${files.length}:v=0:a=1[a]`;
  return ffmpeg([...inputs, '-filter_complex', graph, '-map', '[a]', '-ac', '1', output]);
}

/**
 * Replace a clip's audio with a dubbed speech track over a steady room tone.
 * tempo changes the speech speed without changing pitch; startSec is where the speech begins.
 * ambience is a sound file to loop, or null for a soft generated room tone.
 */
export function dubClip(video, speech, output, { duration, startSec, tempo, ambience, ambienceVolume = 0.5 }) {
  const ambienceInput = ambience
    ? ['-stream_loop', '-1', '-i', ambience]
    : ['-f', 'lavfi', '-i', 'anoisesrc=color=brown:amplitude=0.012:sample_rate=48000'];
  const graph =
    `[1:a]aresample=48000,atempo=${tempo.toFixed(3)},adelay=${Math.round(startSec * 1000)}:all=1,apad[voice];` +
    `[2:a]aresample=48000,${ambience ? `volume=${ambienceVolume}` : 'lowpass=f=700'}[room];` +
    // first_pts=0 fills the time before the delayed voice with silence, so the track starts with the picture.
    `[room][voice]amix=inputs=2:duration=shortest:normalize=0,aresample=async=1:first_pts=0,atrim=0:${duration.toFixed(3)}[a]`;
  return ffmpeg([
    '-i', video, '-i', speech, ...ambienceInput,
    '-filter_complex', graph, '-map', '0:v', '-map', '[a]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-t', duration.toFixed(3), output,
  ]);
}

/**
 * Lay timed music cues over a finished film. Each cue is { file, startSec, endSec, volume,
 * fadeInSec, fadeOutSec, fromSec }: it plays from startSec to endSec (looping if the file is
 * shorter), faded at both ends, starting fromSec into the music file.
 */
export function mixCues(video, cues, output) {
  const inputs = cues.flatMap((c) => ['-stream_loop', '-1', '-i', c.file]);
  const chains = cues.map((c, i) => {
    const length = Math.max(0.1, c.endSec - c.startSec);
    const fadeOut = Math.min(c.fadeOutSec ?? 0.8, length / 2);
    return `[${i + 1}:a]aresample=48000,atrim=start=${(c.fromSec || 0).toFixed(3)}:duration=${length.toFixed(3)},asetpts=PTS-STARTPTS,` +
      `afade=t=in:st=0:d=${Math.min(c.fadeInSec ?? 0.4, length / 2).toFixed(3)},afade=t=out:st=${(length - fadeOut).toFixed(3)}:d=${fadeOut.toFixed(3)},` +
      `volume=${c.volume ?? 0.25},adelay=${Math.round(c.startSec * 1000)}:all=1[c${i}]`;
  });
  const graph = `${chains.join(';')};[0:a]${cues.map((_, i) => `[c${i}]`).join('')}amix=inputs=${cues.length + 1}:duration=first:normalize=0,alimiter=limit=0.95:level=disabled[a]`;
  return ffmpeg([
    '-i', video, ...inputs, '-filter_complex', graph, '-map', '0:v', '-map', '[a]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', output,
  ]);
}

/** Lay music under a video's own audio, ducking the music whenever there is dialogue or sound. */
export function mixMusic(video, music, output, { musicVolume = 0.3 } = {}) {
  const graph =
    `[1:a]volume=${musicVolume},aresample=48000[m];` +
    `[0:a]asplit=2[voice][key];` +
    `[m][key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=500[ducked];` +
    `[voice][ducked]amix=inputs=2:duration=first:normalize=0[a]`;
  return ffmpeg([
    '-i', video, '-stream_loop', '-1', '-i', music,
    '-filter_complex', graph, '-map', '0:v', '-map', '[a]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', output,
  ]);
}
