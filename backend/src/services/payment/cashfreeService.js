import { config } from '../../config/env.js';

/**
 * Cashfree Payments Service (v3 REST API)
 * Handles Order Session Creation, Signature Verification, and Webhooks.
 */

function getCashfreeCredentials() {
  const env = process.env.CASHFREE_ENV || 'PRODUCTION';
  const baseUrl = (env === 'PRODUCTION' || process.env.NODE_ENV === 'production')
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
  const appId = process.env.CASHFREE_APP_ID || '1353108b98b98b751ede89142678013531';
  const secretKey = process.env.CASHFREE_SECRET_KEY || 'cfsk_ma_prod_37a1f5ee7435caebffb90b8f411b95fa_9d8efbf1';
  return { env, baseUrl, appId, secretKey };
}

/**
 * Creates a Cashfree Order & Returns payment_session_id
 */
export async function createCashfreeOrder({ orderId, orderAmount, customerId, customerEmail, customerPhone, planName }) {
  const { baseUrl, appId, secretKey } = getCashfreeCredentials();

  if (!appId || !secretKey) {
    console.warn('[CASHFREE WARN] Cashfree APP_ID or SECRET_KEY missing.');
  }

  console.log(`[CASHFREE SERVICE] Creating Order ID: ${orderId} for ₹${orderAmount} (Plan: ${planName}) via ${baseUrl}...`);

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
    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secretKey,
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
  const { baseUrl, appId, secretKey } = getCashfreeCredentials();
  try {
    const response = await fetch(`${baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secretKey,
      },
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[CASHFREE VERIFY ERROR]', err.message);
    throw err;
  }
}
