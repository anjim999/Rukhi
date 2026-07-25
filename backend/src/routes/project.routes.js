import { Router } from 'express';
import { uploadVideo } from '../utils/fileUpload.js';
import {
  uploadAndCreateProject,
  getProject,
  listProjects,
  getProjectTimeline,
  updateProjectTimeline,
  deleteProject,
} from '../controllers/projectController.js';

/**
 * Project Routes
 *
 * All project-related API endpoints.
 * Routes handle ONLY routing — no logic, no SQL.
 *
 * Endpoints:
 *   POST   /api/projects/upload        → Upload video & create project
 *   GET    /api/projects               → List user's projects (paginated)
 *   GET    /api/projects/:id           → Get single project
 *   GET    /api/projects/:id/timeline  → Get caption timeline
 *   PUT    /api/projects/:id/timeline  → Update caption timeline (editor saves)
 *   DELETE /api/projects/:id           → Delete project
 */

const router = Router();

router.post('/upload', uploadVideo.single('video'), uploadAndCreateProject);
router.get('/', listProjects);
router.get('/:id', getProject);
router.get('/:id/timeline', getProjectTimeline);
router.put('/:id/timeline', updateProjectTimeline);
router.delete('/:id', deleteProject);

export default router;
