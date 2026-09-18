import express from 'express';
import { getAdminAnalytics, listAdminUsers, updateUserPlanOrCredits, getAdminProductionLedger } from '../controllers/adminController.js';

const router = express.Router();

router.get('/analytics', getAdminAnalytics);
router.get('/users', listAdminUsers);
router.patch('/users/:userId', updateUserPlanOrCredits);
router.get('/ledger', getAdminProductionLedger);

export default router;
