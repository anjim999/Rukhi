import * as projectService from '../services/projectService.js';
import { AppError } from '../middleware/errorHandler.js';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env.js';

/**
 * Project Controller
 *
 * Handles HTTP request/response only.
 * All business logic lives in projectService.js.
 * All SQL lives in the service layer — NEVER here.
 */

/**
 * POST /api/projects/upload
 * Upload a video and create a new project.
 */
export async function uploadAndCreateProject(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('No video file uploaded.', 400);
    }

    const title = req.body.title || req.file.originalname;
    const targetStyle = req.body.targetStyle || 'auto';

    // Extract user ID from JWT auth token, header, or body, falling back to default dev user
    const userId = req.user?.id || req.body.userId || req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000001';

    const project = await projectService.createProject({
      userId,
      title,
      videoPath: req.file.path,
      targetStyle,
    });

    res.status(201).json({
      success: true,
      data: project,
      message: 'Video uploaded. Processing has been queued.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/projects/:id
 * Get a single project by ID.
 */
export async function getProject(req, res, next) {
  try {
    const project = await projectService.getProjectById(req.params.id);

    res.json({
      success: true,
      data: project,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/projects
 * Get all projects for the authenticated user (paginated).
 */
export async function listProjects(req, res, next) {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    if (!userId) {
      return res.json({
        success: true,
        data: { projects: [], total: 0, page: 1, limit: 20 },
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const result = await projectService.getProjectsByUser(userId, page, limit);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/projects/:id/timeline
 * Get the caption timeline for a project.
 */
export async function getProjectTimeline(req, res, next) {
  try {
    const timeline = await projectService.getTimeline(req.params.id);

    if (!timeline) {
      throw new AppError('Timeline not yet generated. Please wait for processing to complete.', 404);
    }

    res.json({
      success: true,
      data: timeline,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/projects/:id/timeline
 * Update the caption timeline (user edits from the editor).
 */
export async function updateProjectTimeline(req, res, next) {
  try {
    const { timeline } = req.body;
    if (!timeline || !timeline.segments) {
      throw new AppError('Invalid timeline data. Must include segments array.', 400);
    }

    await projectService.updateTimeline(req.params.id, timeline);

    res.json({
      success: true,
      message: 'Timeline updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/projects/:id
 * Delete a project and all its data.
 */
export async function deleteProject(req, res, next) {
  try {
    await projectService.deleteProject(req.params.id);

    res.json({
      success: true,
      message: 'Project deleted.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/projects/:id/social-pack
 * Generate zero-hallucination Instagram & YouTube post-ready title, caption, and #hashtags based on exact video speech.
 */
export async function getSocialPostPack(req, res, next) {
  try {
    const project = await projectService.getProjectById(req.params.id);
    const timeline = await projectService.getTimeline(req.params.id);

    let fullText = project.title || '';
    if (timeline && timeline.segments) {
      fullText = timeline.segments.flatMap((s) => s.words.map((w) => w.word)).join(' ');
    }

    const { GeminiCaptionDirector } = await import('../services/llm/GeminiCaptionDirector.js');
    const director = new GeminiCaptionDirector();
    const postPack = await director.generateSocialPostPack({
      fullText: fullText || 'Viral video reel content',
      language: 'en',
    });

    res.json({
      success: true,
      data: postPack,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/projects/:id/export
 * Render broadcast-grade 60FPS H.264 MP4 video via FFmpeg.
 */
export async function exportProjectVideo(req, res, next) {
  try {
    const { quality } = req.body || {};
    const { renderProjectVideoMP4 } = await import('../services/media/exportService.js');
    const result = await renderProjectVideoMP4(req.params.id, quality);

    res.json({
      success: true,
      data: result,
      message: 'Ultra-HD MP4 video rendered successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/projects/remux
 * Convert recorded canvas stream to Instagram Reels Ready MP4 (+faststart moov duration header).
 */
export async function remuxRecordedVideo(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('No video file uploaded for remuxing.', 400);
    }
    const { remuxRecordedBlobToInstaMP4 } = await import('../services/media/exportService.js');
    const result = await remuxRecordedBlobToInstaMP4(req.file.path, req.body.title || 'reel');

    res.json({
      success: true,
      data: result,
      message: 'Video packaged into Instagram-ready MP4 with +faststart headers.',
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelProject(req, res, next) {
  try {
    const result = await projectService.cancelProject(req.params.id);
    res.json({
      success: true,
      data: result,
      message: 'Generation cancelled.',
    });
  } catch (err) {
    next(err);
  }
}

export async function translateProjectTimeline(req, res, next) {
  try {
    const { targetStyle = 'english', timeline } = req.body || {};
    let sourceTimeline = timeline;

    if (!sourceTimeline && req.params.id && req.params.id !== 'temp') {
      const project = await projectService.getProjectById(req.params.id);
      sourceTimeline = project ? (project.timeline || await projectService.getTimeline(req.params.id)) : null;
    }

    if (!sourceTimeline) {
      throw new AppError('No caption timeline found for translation.', 400);
    }

    const { GeminiCaptionDirector } = await import('../services/llm/GeminiCaptionDirector.js');
    const director = new GeminiCaptionDirector();
    const translatedTimeline = await director.translateTimelineText(sourceTimeline, targetStyle);

    if (req.params.id && req.params.id !== 'temp') {
      try {
        await projectService.updateProjectTimeline(req.params.id, translatedTimeline);
      } catch (_saveErr) {
        // Ignore save error if temp ID, return translated timeline payload
      }
    }

    res.json({
      success: true,
      data: { timeline: translatedTimeline },
      message: `Captions translated to ${targetStyle} style successfully.`,
    });
  } catch (err) {
    next(err);
  }
}

export async function pauseProject(req, res, next) {
  try {
    const result = await projectService.pauseProject(req.params.id);
    res.json({
      success: true,
      data: result,
      message: 'Generation paused.',
    });
  } catch (err) {
    next(err);
  }
}

export async function resumeProject(req, res, next) {
  try {
    const result = await projectService.resumeProject(req.params.id);
    res.json({
      success: true,
      data: result,
      message: 'Generation resumed.',
    });
  } catch (err) {
    next(err);
  }
}

export async function renameProject(req, res, next) {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }
    const result = await projectService.updateProjectTitle(req.params.id, title.trim());
    res.json({
      success: true,
      data: result,
      message: 'Project title updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

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
