import * as projectService from '../services/projectService.js';
import { AppError } from '../middleware/errorHandler.js';

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
    const { renderProjectVideoMP4 } = await import('../services/media/exportService.js');
    const result = await renderProjectVideoMP4(req.params.id);

    res.json({
      success: true,
      data: result,
      message: '60FPS H.264 MP4 video rendered successfully.',
    });
  } catch (err) {
    next(err);
  }
}
