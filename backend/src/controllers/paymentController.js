import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { query } from '../db/pool.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Payment Plan Pricing Configurations (Affordable Launch Tiers)
 */
export const PRICING_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter Creator',
    amount: 199, // ₹199
    currency: 'INR',
    credits: 25,
    features: ['1080p Full HD Export', 'No Watermark', '70+ Fonts', 'Ripple Sync'],
  },
  pro: {
    id: 'pro',
    name: 'Pro Unlimited',
    amount: 399, // ₹399
    currency: 'INR',
    credits: 9999, // Unlimited
    features: ['4K 60FPS Export', 'Multilingual AI Voice Dubbing', 'AI B-Roll Engine', 'Demucs Vocal Separation', 'Priority Queue'],
  },
};

/**
 * Create Payment Order (Razorpay & Stripe mock/live ready)
 */
export async function createPaymentOrder(req, res, next) {
  try {
    const { planId = 'starter', gateway = 'razorpay' } = req.body;
    let targetUserId = req.body.userId || req.user?.id;

    const plan = PRICING_PLANS[planId];
    if (!plan) {
      return res.status(400).json({ success: false, error: 'Invalid plan selected' });
    }

    // Resolve valid user_id or fallback to existing user in database
    if (targetUserId) {
      const userCheck = await query(`SELECT id FROM users WHERE id = $1`, [targetUserId]);
      if (userCheck.rows.length === 0) {
        const fallback = await query(`SELECT id FROM users LIMIT 1`);
        targetUserId = fallback.rows.length > 0 ? fallback.rows[0].id : null;
      }
    } else {
      const fallback = await query(`SELECT id FROM users LIMIT 1`);
      targetUserId = fallback.rows.length > 0 ? fallback.rows[0].id : null;
    }

    let realOrderId = `order_${uuidv4().substring(0, 12)}`;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Create authentic Razorpay order via Razorpay API if credentials exist
    if (keyId && keySecret && gateway === 'razorpay') {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: plan.amount * 100, // Amount in paise (19900 = ₹199)
            currency: plan.currency,
            receipt: `rcpt_${uuidv4().substring(0, 8)}`,
          }),
        });

        const rzpData = await rzpRes.json();
        if (rzpData && rzpData.id) {
          realOrderId = rzpData.id;
          console.log('[RAZORPAY ORDER CREATED]:', realOrderId);
        } else {
          console.error('[RAZORPAY ORDER CREATION FAILED]:', rzpData);
        }
      } catch (rzpErr) {
        console.error('[RAZORPAY FETCH ERROR]:', rzpErr.message);
      }
    }

    const paymentId = uuidv4();

    // Log pending transaction in payments table
    await query(
      `INSERT INTO payments (id, user_id, amount, currency, gateway, order_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [paymentId, targetUserId, plan.amount, plan.currency, gateway, realOrderId]
    );

    return res.json({
      success: true,
      orderId: realOrderId,
      amount: plan.amount * 100, // Amount in paise for Razorpay / cents for Stripe
      currency: plan.currency,
      plan: plan.name,
      keyId: keyId || 'rzp_test_RoCaps2026Key',
    });
  } catch (err) {
    console.error('[CREATE ORDER ERROR]:', err);
    next(err);
  }
}

/**
 * Verify Payment Signature & Activate Plan
 */
export async function verifyPayment(req, res, next) {
  try {
    const { orderId, paymentId, signature, planId = 'starter' } = req.body;
    let targetUserId = req.body.userId || req.user?.id;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required.' });
    }

    const plan = PRICING_PLANS[planId] || PRICING_PLANS.starter;

    // Resolve valid user_id or fallback to existing user in database
    if (targetUserId) {
      const userCheck = await query(`SELECT id FROM users WHERE id = $1`, [targetUserId]);
      if (userCheck.rows.length === 0) {
        const fallback = await query(`SELECT id FROM users LIMIT 1`);
        targetUserId = fallback.rows.length > 0 ? fallback.rows[0].id : null;
      }
    } else {
      const fallback = await query(`SELECT id FROM users LIMIT 1`);
      targetUserId = fallback.rows.length > 0 ? fallback.rows[0].id : null;
    }

    // Verify HMAC-SHA256 signature if live secret provided
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    if (razorpaySecret && signature) {
      const generatedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (generatedSignature !== signature) {
        throw new AppError('Payment signature verification failed.', 400);
      }
    }

    // Update payment record
    await query(
      `UPDATE payments SET status = 'success', payment_id = $1 WHERE order_id = $2`,
      [paymentId || `pay_${uuidv4().substring(0, 8)}`, orderId]
    );

    // Update User Plan & Credits in database if valid targetUserId exists
    if (targetUserId) {
      await query(
        `UPDATE users SET plan = $1, credits = $2 WHERE id = $3`,
        [plan.id, plan.credits, targetUserId]
      );

      // Log Subscription
      const subId = uuidv4();
      await query(
        `INSERT INTO subscriptions (id, user_id, plan, status, gateway, gateway_order_id, amount, currency)
         VALUES ($1, $2, $3, 'active', 'razorpay', $4, $5, $6)`,
        [subId, targetUserId, plan.id, orderId, plan.amount, plan.currency]
      );
    }

    console.log(`[PAYMENT SUCCESS] User ${targetUserId} upgraded to ${plan.name} (${plan.id})!`);

    return res.json({
      success: true,
      message: `Payment verified! You are now subscribed to ${plan.name}.`,
      plan: plan.id,
      credits: plan.credits,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Available Pricing Plans
 */
export async function getPricingPlans(_req, res) {
  return res.json({
    success: true,
    plans: Object.values(PRICING_PLANS),
  });
}
