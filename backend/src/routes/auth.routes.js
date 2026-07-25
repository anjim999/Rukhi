import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.google);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authenticateUser, authController.me);

export default router;
