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

    // TODO: Replace with real auth user ID once auth is implemented
    const userId = req.body.userId || req.headers['x-user-id'];
    if (!userId) {
      throw new AppError('User ID is required (pass via x-user-id header or body).', 400);
    }

    const project = await projectService.createProject({
      userId,
      title,
      videoPath: req.file.path,
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
    const userId = req.headers['x-user-id'];
    if (!userId) {
      throw new AppError('User ID is required (pass via x-user-id header).', 400);
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
