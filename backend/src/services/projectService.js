import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { query } from '../db/pool.js';
import { addMediaProcessingJob } from './queue/queueService.js';
import { AppError } from '../middleware/errorHandler.js';
import { PROJECT_STATUSES } from '../../../shared/constants/timeline.js';

export async function createProject({ userId, title, videoPath, targetStyle = 'auto' }) {
  const id = uuidv4();

  // Store browser-accessible URL path, not filesystem absolute path
  const filename = path.basename(videoPath);
  const videoUrl = `/uploads/${filename}`;

  const result = await query(
    `INSERT INTO projects (id, user_id, title, video_url, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, title, video_url, status, created_at`,
    [id, userId, title, videoUrl, PROJECT_STATUSES.PENDING]
  );

  const project = result.rows[0];

  await addMediaProcessingJob({
    projectId: project.id,
    videoPath,
    userId,
    targetStyle,
  });

  console.log(`[PROJECT] Created project ${project.id} (Style: ${targetStyle}) and queued for processing.`);
  return project;
}

export async function getProjectById(projectId) {
  const result = await query(
    `SELECT id, user_id, title, video_url, audio_url, duration, status, error_message, created_at
     FROM projects WHERE id = $1`,
    [projectId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Project not found', 404);
  }

  return result.rows[0];
}

export async function getProjectsByUser(userId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const [dataResult, countResult] = await Promise.all([
    query(
      `SELECT id, title, video_url, duration, status, error_message, created_at
       FROM projects
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
    query(
      `SELECT COUNT(*) AS total FROM projects WHERE user_id = $1`,
      [userId]
    ),
  ]);

  return {
    projects: dataResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
    page,
    limit,
  };
}

export async function updateProjectStatus(projectId, status, extras = {}) {
  const setClauses = ['status = $2'];
  const values = [projectId, status];
  let paramIndex = 3;

  if (extras.audioUrl) {
    setClauses.push(`audio_url = $${paramIndex}`);
    values.push(extras.audioUrl);
    paramIndex++;
  }

  if (extras.duration != null) {
    setClauses.push(`duration = $${paramIndex}`);
    values.push(extras.duration);
    paramIndex++;
  }

  if (extras.errorMessage !== undefined) {
    setClauses.push(`error_message = $${paramIndex}`);
    values.push(extras.errorMessage);
    paramIndex++;
  }

  await query(
    `UPDATE projects SET ${setClauses.join(', ')} WHERE id = $1`,
    values
  );

  console.log(`[PROJECT] Updated project ${projectId} → status: ${status}`);
}

export async function saveTimeline(projectId, timelineJson) {
  await query(
    `INSERT INTO captions (id, project_id, timeline_json, version, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (project_id)
     DO UPDATE SET timeline_json = $3, version = $4, updated_at = NOW()`,
    [uuidv4(), projectId, JSON.stringify(timelineJson), timelineJson.version || '1.0']
  );

  console.log(`[PROJECT] Saved timeline for project ${projectId}`);
}

export async function getTimeline(projectId) {
  const result = await query(
    `SELECT timeline_json, version, updated_at
     FROM captions WHERE project_id = $1`,
    [projectId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].timeline_json;
}

export async function updateTimeline(projectId, timelineJson) {
  await query(
    `INSERT INTO captions (id, project_id, timeline_json, version, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (project_id)
     DO UPDATE SET timeline_json = $3, version = $4, updated_at = NOW()`,
    [uuidv4(), projectId, JSON.stringify(timelineJson), timelineJson.version || '1.0']
  );
}

export async function deleteProject(projectId) {
  const result = await query(
    `DELETE FROM projects WHERE id = $1`,
    [projectId]
  );

  if (result.rowCount === 0) {
    console.log(`[PROJECT] Project ${projectId} already deleted or not found in database.`);
    return { id: projectId, deleted: true };
  }

  console.log(`[PROJECT] Deleted project ${projectId}`);
  return { id: projectId, deleted: true };
}

export async function cancelProject(projectId) {
  await updateProjectStatus(projectId, PROJECT_STATUSES.CANCELLED, {
    errorMessage: 'Generation cancelled by user.',
  });
  console.log(`[PROJECT] Cancelled generation for project ${projectId}`);
  return { id: projectId, status: PROJECT_STATUSES.CANCELLED };
}

export async function pauseProject(projectId) {
  await updateProjectStatus(projectId, PROJECT_STATUSES.PAUSED);
  console.log(`[PROJECT] Paused generation for project ${projectId}`);
  return { id: projectId, status: PROJECT_STATUSES.PAUSED };
}

export async function resumeProject(projectId) {
  await updateProjectStatus(projectId, PROJECT_STATUSES.TRANSCRIBING);
  console.log(`[PROJECT] Resumed generation for project ${projectId}`);
  return { id: projectId, status: PROJECT_STATUSES.TRANSCRIBING };
}
