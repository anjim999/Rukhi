/**
 * Step 5+6 ONLY — BGM + Master Assembly
 * All 6 Veo 3.1 clips already exist in tmp/
 */
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const FFMPEG_BIN = path.resolve('backend/node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe');
const tmpDir = path.resolve('tmp');
const outputDir = path.resolve('outputs');

async function finishAssembly() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎬 FINISHING MASTER ASSEMBLY (Steps 5+6)');
  console.log('   All 6 Veo 3.1 clips already generated!');
  console.log('═══════════════════════════════════════════════════════\n');

  // Verify all 6 Veo clips exist
  const clipPaths = [];
  for (let i = 1; i <= 6; i++) {
    const p = path.join(tmpDir, `boss_cat_veo_clip_${i}.mp4`);
    if (fs.existsSync(p) && fs.statSync(p).size > 50000) {
      console.log(`  ✅ Scene ${i}: ${path.basename(p)} (${(fs.statSync(p).size / 1024 / 1024).toFixed(2)} MB)`);
      clipPaths.push(p);
    } else {
      console.error(`  ❌ Missing clip: ${p}`);
    }
  }

  const voicePath = path.join(tmpDir, 'boss_cat_voiceover.mp3');
  const srtPath = path.join(tmpDir, 'boss_cat_subtitles.srt');

  if (!fs.existsSync(voicePath)) {
    console.error('❌ Voiceover missing!');
    return;
  }

  // Get voiceover duration
  let voiceDuration = 45;
  try {
    const { stderr } = await execPromise(`"${FFMPEG_BIN}" -i "${voicePath}" -f null - 2>&1`).catch(e => ({ stderr: e.stderr || '' }));
    const match = (stderr || '').match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
    if (match) {
      voiceDuration = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 100;
    }
  } catch (_) {}
  console.log(`\n  ⏱️ Voiceover duration: ${voiceDuration.toFixed(1)}s`);

  // ─── Step 5: Simple BGM (no tremolo/vibrato — avoids libmp3lame bug) ───
  console.log('\n🎵 [STEP 5/6] Synthesizing BGM (simple safe filter)...');
  const bgmPath = path.join(tmpDir, 'boss_cat_bgm.wav');
  const dur = Math.ceil(voiceDuration + 5);
  
  // Generate as WAV first (avoids libmp3lame assertion), then convert
  const bgmCmd = `"${FFMPEG_BIN}" -y -f lavfi -i "sine=frequency=82:duration=${dur}" -f lavfi -i "sine=frequency=165:duration=${dur}" -f lavfi -i "anoisesrc=d=${dur}:c=pink:r=44100:a=0.015" -filter_complex "[0:a]volume=0.3[bass];[1:a]volume=0.15[mid];[2:a]lowpass=f=400,volume=0.12[amb];[bass][mid][amb]amix=inputs=3[out]" -map "[out]" -c:a pcm_s16le -ar 44100 "${bgmPath}"`;
  await execPromise(bgmCmd);
  
  // Convert WAV to MP3 safely
  const bgmMp3 = path.join(tmpDir, 'boss_cat_bgm.mp3');
  await execPromise(`"${FFMPEG_BIN}" -y -i "${bgmPath}" -c:a libmp3lame -b:a 128k "${bgmMp3}"`);
  console.log(`✅ [STEP 5/6] BGM ready: ${bgmMp3} (${(fs.statSync(bgmMp3).size / 1024).toFixed(0)} KB)`);

  // ─── Step 6: Master Assembly ───────────────────────────────────────
  console.log('\n🚀 [STEP 6/6] MASTER ASSEMBLY...\n');

  // 6a: Normalize all clips to 1080x1920 30fps
  const normalizedClips = [];
  for (let i = 0; i < clipPaths.length; i++) {
    const normPath = path.join(tmpDir, `boss_cat_norm_${i}.mp4`);
    const vf = `fps=30,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,format=yuv420p`;
    try {
      await execPromise(`"${FFMPEG_BIN}" -y -i "${clipPaths[i]}" -vf "${vf}" -c:v libx264 -preset fast -crf 18 -an -r 30 -g 30 -keyint_min 30 "${normPath}"`);
      console.log(`  ✅ Normalized clip ${i + 1}: ${path.basename(normPath)}`);
      normalizedClips.push(normPath);
    } catch (e) {
      console.warn(`  ⚠️ Norm fallback clip ${i + 1}: using raw`);
      normalizedClips.push(clipPaths[i]);
    }
  }

  // 6b: Concat all clips
  const concatList = path.join(tmpDir, 'boss_cat_concat.txt');
  fs.writeFileSync(concatList, normalizedClips.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n'));

  const concatVideo = path.join(tmpDir, 'boss_cat_video_track.mp4');
  await execPromise(`"${FFMPEG_BIN}" -y -f concat -safe 0 -i "${concatList}" -c copy "${concatVideo}"`);
  console.log(`  ✅ Stitched ${normalizedClips.length} clips`);

  // 6c: Mix voiceover + BGM
  const mixedAudio = path.join(tmpDir, 'boss_cat_audio_mix.mp3');
  await execPromise(`"${FFMPEG_BIN}" -y -i "${voicePath}" -i "${bgmMp3}" -filter_complex "[0:a]volume=1.0[voice];[1:a]volume=0.18[bgm];[voice][bgm]amix=inputs=2:duration=first[out]" -map "[out]" -c:a libmp3lame -b:a 192k "${mixedAudio}"`);
  console.log(`  ✅ Audio mix done: voiceover + BGM (ducked 18%)`);

  // 6d: Final master clean (no captions/subtitles)
  const masterPath = path.join(outputDir, 'boss_cat_buffalo_45s_FINAL.mp4');
  const maxDur = Math.min(voiceDuration + 2, 50);

  await execPromise(`"${FFMPEG_BIN}" -y -i "${concatVideo}" -i "${mixedAudio}" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -t ${maxDur} "${masterPath}"`);

  if (fs.existsSync(masterPath)) {
    const stats = fs.statSync(masterPath);
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎉🎉🎉 MASTER 45-SECOND VIRAL REEL COMPLETE!');
    console.log(`📁 File: ${masterPath}`);
    console.log(`📊 Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`🌐 Preview: http://localhost:5000/outputs/boss_cat_buffalo_45s_FINAL.mp4`);
    console.log('═══════════════════════════════════════════════════════');
  }
}

finishAssembly().catch(err => {
  console.error('❌ FATAL:', err);
  process.exit(1);
});
