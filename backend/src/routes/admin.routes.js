import express from 'express';
import { getAdminAnalytics, listAdminUsers, updateUserPlanOrCredits } from '../controllers/adminController.js';

const router = express.Router();

router.get('/analytics', getAdminAnalytics);
router.get('/users', listAdminUsers);
router.patch('/users/:userId', updateUserPlanOrCredits);

export default router;
