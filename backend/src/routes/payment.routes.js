import express from 'express';
import { createPaymentOrder, verifyPayment, getPricingPlans } from '../controllers/paymentController.js';

const router = express.Router();

router.get('/plans', getPricingPlans);
router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);

export default router;
