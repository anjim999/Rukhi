import fs from 'fs';
import path from 'path';
import config from '../config/env.js';
import * as projectService from '../services/projectService.js';
import AppError from '../utils/AppError.js';

/**
 * GET /api/projects/:id/download
 * Stream the rendered MP4 file directly with proper headers.
 * Guarantees correct binary delivery on all devices and browsers.
 */
export async function downloadExportedVideo(req, res, next) {
  try {
    const projectId = req.params.id;

    // Fetch project title for filename
    const project = await projectService.getProjectById(projectId);
    if (!project) {
      throw new AppError('Project not found.', 404);
    }

    const outputFileName = `export_${projectId}_60fps.mp4`;
    const outputFilePath = path.join(config.outputDir, outputFileName);

    if (!fs.existsSync(outputFilePath)) {
      throw new AppError('Exported video not found. Please export first.', 404);
    }

    const stat = fs.statSync(outputFilePath);

    // Build a clean download filename from the project title
    let cleanTitle = (project.title || 'reel').trim();
    cleanTitle = cleanTitle.replace(/\.(mp4|mov|webm|m4v|avi|mkv)$/i, '');
    cleanTitle = cleanTitle.replace(/[^\w\s\-\.]/g, '').trim().replace(/\s+/g, '_');
    if (!cleanTitle) cleanTitle = 'reel';
    const downloadName = `${cleanTitle}.mp4`;

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Cache-Control', 'no-cache');

    const readStream = fs.createReadStream(outputFilePath);
    readStream.pipe(res);
  } catch (err) {
    next(err);
  }
}
