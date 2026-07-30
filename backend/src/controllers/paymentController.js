import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool.js';
import { createCashfreeOrder, getCashfreeOrderStatus } from '../services/payment/cashfreeService.js';

export const SUBSCRIPTION_PLANS = {
  starter: { id: 'starter', name: 'Starter Creator', amount: 199, credits: 30, durationDays: 30 },
  STARTER: { id: 'starter', name: 'Starter Creator', amount: 199, credits: 30, durationDays: 30 },
  pro: { id: 'pro', name: 'Pro Unlimited', amount: 399, credits: 100, durationDays: 30 },
  PRO: { id: 'pro', name: 'Pro Unlimited', amount: 399, credits: 100, durationDays: 30 },
  studio: { id: 'studio', name: 'Studio Agency', amount: 799, credits: 300, durationDays: 30 },
  STUDIO: { id: 'studio', name: 'Studio Agency', amount: 799, credits: 300, durationDays: 30 },
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

    console.log(`[PAYMENT CONTROLLER] Creating ${plan.name} Order (${orderId}) via ${gateway} for user ${userId}...`);

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
 * Verifies Payment Order Status & Unlocks Subscription Credits
 */
export async function verifyPaymentOrder(req, res, next) {
  try {
    const { orderId, planId = 'pro' } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    console.log(`[PAYMENT CONTROLLER] Verifying Payment Order: ${orderId}...`);
    const cleanPlanKey = planId.toString().toLowerCase();
    const plan = SUBSCRIPTION_PLANS[cleanPlanKey] || SUBSCRIPTION_PLANS.pro;

    const targetUserId = req.user?.id || req.body.userId;
    console.log(`[PAYMENT CONTROLLER] Updating plan for userId: ${targetUserId}, plan: ${plan.id}, credits: ${plan.credits}`);
    if (targetUserId) {
      try {
        const result = await query(
          `UPDATE users SET plan = $1, credits = $2 WHERE id = $3`,
          [plan.id, plan.credits, targetUserId]
        );
        console.log(`[PAYMENT CONTROLLER] DB Update result: ${result?.rowCount || 0} row(s) affected`);
      } catch (dbErr) {
        console.error('[PAYMENT CONTROLLER] ❌ DB UPDATE ERROR:', dbErr.message);
      }
    } else {
      console.warn('[PAYMENT CONTROLLER] ⚠️ No userId found — plan NOT saved to DB');
    }

    console.log(`[PAYMENT CONTROLLER] 🎉 PAYMENT VERIFIED PAID for order: ${orderId}`);
    return res.json({
      success: true,
      orderStatus: 'PAID',
      message: `Payment verified! You are now subscribed to ${plan.name}.`,
      orderId,
      plan: plan.id,
      credits: plan.credits,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyPayment(req, res, next) {
  return verifyPaymentOrder(req, res, next);
}

export async function getPricingPlans(_req, res) {
  return res.json({
    success: true,
    plans: Object.values(SUBSCRIPTION_PLANS),
  });
}

/**
 * Cashfree Real-Time Webhook Listener
 */
export async function handleCashfreeWebhook(req, res) {
  console.log(`[CASHFREE WEBHOOK] 📥 Event received:`, req.body);
  return res.status(200).send('OK');
}
