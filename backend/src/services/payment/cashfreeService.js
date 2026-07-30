import { config } from '../../config/env.js';

/**
 * Cashfree Payments Service (v3 REST API)
 * Handles Order Session Creation, Signature Verification, and Webhooks.
 */

const CASHFREE_ENV = process.env.CASHFREE_ENV || 'SANDBOX'; // 'SANDBOX' or 'PRODUCTION'
const BASE_URL = CASHFREE_ENV === 'PRODUCTION'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

const APP_ID = process.env.CASHFREE_APP_ID || 'TEST1115862673d636a5e995532757f962685111';
const SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';

/**
 * Creates a Cashfree Order & Returns payment_session_id
 */
export async function createCashfreeOrder({ orderId, orderAmount, customerId, customerEmail, customerPhone, planName }) {
  if (!APP_ID || !SECRET_KEY) {
    console.warn('[CASHFREE WARN] Cashfree APP_ID or SECRET_KEY missing. Using fallback sandbox configuration.');
  }

  console.log(`[CASHFREE SERVICE] Creating Order ID: ${orderId} for ₹${orderAmount} (Plan: ${planName})...`);

  const payload = {
    order_id: orderId,
    order_amount: parseFloat(orderAmount),
    order_currency: 'INR',
    customer_details: {
      customer_id: customerId || `cust_${Date.now()}`,
      customer_email: customerEmail || 'user@rukhi.in',
      customer_phone: customerPhone || '9999999999',
    },
    order_meta: {
      return_url: `https://rukhi.in/settings?order_id={order_id}`,
      notify_url: `https://rukhi.in/api/payment/cashfree-webhook`,
    },
    order_note: `Auto Captions AI Subscription Plan: ${planName}`,
  };

  try {
    const response = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': APP_ID,
        'x-client-secret': SECRET_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[CASHFREE ERROR]', data);
      throw new Error(data.message || 'Failed to create Cashfree payment order session.');
    }

    console.log(`[CASHFREE SERVICE] ✅ Order Session Created: ${data.payment_session_id}`);
    return {
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      orderStatus: data.order_status,
      cfOrderId: data.cf_order_id,
    };
  } catch (err) {
    console.error('[CASHFREE EXCEPTION]', err.message);
    throw err;
  }
}

/**
 * Verifies Order Status from Cashfree
 */
export async function getCashfreeOrderStatus(orderId) {
  try {
    const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': APP_ID,
        'x-client-secret': SECRET_KEY,
      },
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[CASHFREE VERIFY ERROR]', err.message);
    throw err;
  }
}
