import { Router } from 'express';
import { uploadVideo } from '../utils/fileUpload.js';
import { optionalAuth } from '../middleware/auth.js';
import {
  uploadAndCreateProject,
  getProject,
  listProjects,
  getProjectTimeline,
  updateProjectTimeline,
  deleteProject,
  getSocialPostPack,
  exportProjectVideo,
  cancelProject,
  pauseProject,
  resumeProject,
  renameProject,
} from '../controllers/projectController.js';

const router = Router();

router.use(optionalAuth);

router.post('/upload', uploadVideo.single('video'), uploadAndCreateProject);
router.get('/', listProjects);
router.get('/:id', getProject);
router.get('/:id/timeline', getProjectTimeline);
router.put('/:id/timeline', updateProjectTimeline);
router.patch('/:id/rename', renameProject);
router.post('/:id/social-pack', getSocialPostPack);
router.post('/:id/export', exportProjectVideo);
router.post('/:id/cancel', cancelProject);
router.post('/:id/pause', pauseProject);
router.post('/:id/resume', resumeProject);
router.delete('/:id', deleteProject);

export default router;
