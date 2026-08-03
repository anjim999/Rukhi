import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import { query } from '../../db/pool.js';

/**
 * Rukhi Studio Episode Stitcher Service
 * Concatenates multiple scene video clips into 1 seamless master episode video file using FFmpeg.
 */

export const episodeStitcherService = {
  async stitchEpisodeScenes({ seriesId, episodeNumber = 1 }) {
    console.log(`[EPISODE STITCHER] 🎬 Concatenating scenes for Series ${seriesId}, Episode #${episodeNumber}...`);

    // Fetch all scene manifests for this episode ordered by scene_number
    const res = await query(
      `SELECT sg.scene_number, sg.title, pm.output_video_url
       FROM studio_scene_graphs sg
       JOIN studio_production_manifests pm ON sg.id = pm.scene_id
       WHERE sg.series_id = $1 AND sg.episode_number = $2
       ORDER BY sg.scene_number ASC`,
      [seriesId, episodeNumber]
    );

    if (res.rows.length === 0) {
      throw new Error(`No generated scene clips found for Episode #${episodeNumber}.`);
    }

    console.log(`[EPISODE STITCHER] 🎞️ Found ${res.rows.length} scene clips to stitch!`);

    const outputsDir = path.resolve(process.cwd(), 'outputs');
    const backendOutputsDir = path.resolve(process.cwd(), 'backend/outputs');

    // Filter valid physical video files on disk
    const validVideoFiles = [];
    for (const row of res.rows) {
      const filename = path.basename(row.output_video_url);
      const filePath = path.join(outputsDir, filename);
      if (fs.existsSync(filePath)) {
        validVideoFiles.push(filePath);
      }
    }

    if (validVideoFiles.length === 0) {
      throw new Error(`No physical video files found on disk for Episode #${episodeNumber}.`);
    }

    // Output episode filename
    const masterFilename = `episode_${seriesId}_ep${episodeNumber}_master.mp4`;
    const masterPath = path.join(outputsDir, masterFilename);
    const masterBackendPath = path.join(backendOutputsDir, masterFilename);

    // Single scene quick-copy optimization
    if (validVideoFiles.length === 1) {
      fs.copyFileSync(validVideoFiles[0], masterPath);
      fs.copyFileSync(validVideoFiles[0], masterBackendPath);
      return {
        success: true,
        masterVideoUrl: `/outputs/${masterFilename}`,
        sceneCount: 1
      };
    }

    // FFmpeg Concat file manifest
    const concatTxtPath = path.join(outputsDir, `concat_ep${episodeNumber}.txt`);
    const concatContent = validVideoFiles.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n');
    fs.writeFileSync(concatTxtPath, concatContent);

    return new Promise((resolve, reject) => {
      const ffmpegCmd = `"${ffmpegPath}" -y -f concat -safe 0 -i "${concatTxtPath}" -c copy "${masterPath}"`;
      console.log(`[EPISODE STITCHER] ⚙️ Executing FFmpeg Concat: ${ffmpegCmd}`);

      exec(ffmpegCmd, (err) => {
        if (fs.existsSync(concatTxtPath)) fs.unlinkSync(concatTxtPath);

        if (err) {
          console.warn(`[EPISODE STITCHER WARN] FFmpeg concat copy failed, retrying re-encode...`, err.message);
          const fallbackCmd = `"${ffmpegPath}" -y -f concat -safe 0 -i "${concatTxtPath}" -c:v libx264 -c:a aac "${masterPath}"`;
          exec(fallbackCmd, (fallbackErr) => {
            if (fallbackErr) return reject(fallbackErr);
            if (fs.existsSync(masterPath)) fs.copyFileSync(masterPath, masterBackendPath);
            resolve({
              success: true,
              masterVideoUrl: `/outputs/${masterFilename}`,
              sceneCount: validVideoFiles.length
            });
          });
          return;
        }

        if (fs.existsSync(masterPath)) fs.copyFileSync(masterPath, masterBackendPath);

        console.log(`[EPISODE STITCHER] 🎉 Master Episode Video rendered successfully: /outputs/${masterFilename}`);
        resolve({
          success: true,
          masterVideoUrl: `/outputs/${masterFilename}`,
          sceneCount: validVideoFiles.length
        });
      });
    });
  }
};
