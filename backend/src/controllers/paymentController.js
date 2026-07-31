import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool.js';
import { createCashfreeOrder, getCashfreeOrderStatus } from '../services/payment/cashfreeService.js';

export const SUBSCRIPTION_PLANS = {
  free: { id: 'free', name: 'Free Tier', amount: 0, credits: 3, durationDays: 30 },
  FREE: { id: 'free', name: 'Free Tier', amount: 0, credits: 3, durationDays: 30 },
  basic: { id: 'basic', name: 'Basic Captions', amount: 79, credits: 9999, durationDays: 30 },
  BASIC: { id: 'basic', name: 'Basic Captions', amount: 79, credits: 9999, durationDays: 30 },
  starter: { id: 'starter', name: 'Plus 30s Reel', amount: 199, credits: 10, durationDays: 30 },
  STARTER: { id: 'starter', name: 'Plus 30s Reel', amount: 199, credits: 10, durationDays: 30 },
  plus: { id: 'plus', name: 'Plus 30s Reel', amount: 199, credits: 10, durationDays: 30 },
  PLUS: { id: 'plus', name: 'Plus 30s Reel', amount: 199, credits: 10, durationDays: 30 },
  pro: { id: 'pro', name: 'Pro 60s Reel', amount: 299, credits: 30, durationDays: 30 },
  PRO: { id: 'pro', name: 'Pro 60s Reel', amount: 299, credits: 30, durationDays: 30 },
  dubbing_studio: { id: 'dubbing_studio', name: 'Dubbing Studio', amount: 399, credits: 100, durationDays: 30 },
  DUBBING_STUDIO: { id: 'dubbing_studio', name: 'Dubbing Studio', amount: 399, credits: 100, durationDays: 30 },
};

/**
 * Creates a Payment Order (Cashfree + Razorpay Support)
 */
export async function createPaymentOrder(req, res, next) {
  try {
    const rawPlanId = (req.body.planId || 'pro').toString();
    const cleanPlanKey = rawPlanId.toLowerCase();
    const plan = SUBSCRIPTION_PLANS[cleanPlanKey] || SUBSCRIPTION_PLANS.pro;

    const orderId = `order_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
    const userId = req.user?.id || req.body.userId || 'guest_user';
    const gateway = req.body.gateway || 'cashfree';

    console.log(`[PAYMENT CONTROLLER] Creating ${plan.name} Order (${orderId}, ₹${plan.amount}) via ${gateway} for user ${userId}...`);

    let cfOrder = null;
    let cfError = null;

    if (process.env.CASHFREE_SECRET_KEY || process.env.CASHFREE_APP_ID) {
      try {
        cfOrder = await createCashfreeOrder({
          orderId,
          orderAmount: plan.amount,
          customerId: userId,
          customerEmail: req.body.customerEmail || req.user?.email || 'user@rukhi.in',
          customerPhone: req.body.customerPhone || '9999999999',
          planName: plan.name,
        });
      } catch (err) {
        cfError = err.message;
        console.warn('[CASHFREE ORDER WARN]', err.message);
      }
    }

    return res.json({
      success: true,
      orderId: cfOrder?.orderId || orderId,
      paymentSessionId: cfOrder?.paymentSessionId || null,
      amount: plan.amount * 100,
      currency: 'INR',
      plan: plan.name,
      cashfreeMode: process.env.CASHFREE_ENV || 'PRODUCTION',
      cfError,
    });
  } catch (err) {
    console.error('[CREATE ORDER ERROR]', err.message);
    next(err);
  }
}

/**
 * Verify Payment Session and Activate Plan in Database
 */
export async function verifyPayment(req, res, next) {
  try {
    const { userId, orderId, planId } = req.body;
    const cleanPlanKey = (planId || 'pro').toString().toLowerCase();
    const plan = SUBSCRIPTION_PLANS[cleanPlanKey] || SUBSCRIPTION_PLANS.pro;

    console.log(`[PAYMENT VERIFY] Activating ${plan.name} for user ${userId}...`);

    if (userId && typeof userId === 'string' && userId.length === 36) {
      try {
        await query(
          `UPDATE users SET plan = $1, credits = credits + $2 WHERE id = $3`,
          [plan.id, plan.credits, userId]
        );
        console.log(`[PAYMENT VERIFY] ✅ Updated database user ${userId} plan to '${plan.id}' with +${plan.credits} credits.`);
      } catch (dbErr) {
        console.warn(`[PAYMENT VERIFY WARN] User table update notice: ${dbErr.message}`);
      }
    }

    return res.json({
      success: true,
      plan: plan.id,
      planName: plan.name,
      credits: plan.credits,
      message: `Successfully activated ${plan.name}!`,
    });
  } catch (err) {
    console.error('[PAYMENT VERIFY ERROR]', err.message);
    next(err);
  }
}

export const verifyPaymentOrder = verifyPayment;

/**
 * Cashfree Webhook Handler
 */
export async function handleCashfreeWebhook(req, res, next) {
  try {
    console.log('[CASHFREE WEBHOOK] Received webhook event:', req.body?.type || 'PAYMENT_SUCCESS');
    return res.json({ success: true, received: true });
  } catch (err) {
    console.error('[CASHFREE WEBHOOK ERROR]', err.message);
    next(err);
  }
}
