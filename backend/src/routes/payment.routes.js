import express from 'express';
import { createPaymentOrder, verifyPaymentOrder, handleCashfreeWebhook } from '../controllers/paymentController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-order', optionalAuth, createPaymentOrder);
router.post('/verify-payment', optionalAuth, verifyPaymentOrder);
router.post('/verify', optionalAuth, verifyPaymentOrder);
router.post('/cashfree-webhook', handleCashfreeWebhook);

export default router;
