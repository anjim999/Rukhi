import axiosClient from '../api/axiosClient';

/**
 * Cashfree Payment Frontend Service
 * Handles Order Creation and Cashfree SDK Popup Checkout Modal.
 */

export async function createPaymentOrder({ planId = 'PRO', customerEmail, customerPhone }) {
  const data = await axiosClient.post('/payments/create-order', {
    planId,
    customerEmail,
    customerPhone,
  });
  return data;
}

export async function verifyPaymentOrder({ orderId, planId }) {
  const data = await axiosClient.post('/payments/verify-payment', {
    orderId,
    planId,
  });
  return data;
}

/**
 * Opens Cashfree Popup Checkout Modal
 */
export async function launchCashfreeCheckout({ paymentSessionId, mode = 'SANDBOX', onPaid, onError }) {
  if (!window.Cashfree) {
    console.error('[CASHFREE SDK ERROR] Cashfree SDK not loaded in window. Ensure cashfree.js script is included.');
    throw new Error('Cashfree Payment SDK is loading. Please try again in 5 seconds.');
  }

  const cashfree = window.Cashfree({
    mode: mode === 'PRODUCTION' ? 'production' : 'sandbox',
  });

  const checkoutOptions = {
    paymentSessionId,
    redirectTarget: '_modal', // Opens sleek Popup Modal right on your website!
  };

  try {
    console.log(`[CASHFREE CHECKOUT] Opening Popup Checkout Modal (Session: ${paymentSessionId})...`);
    const result = await cashfree.checkout(checkoutOptions);

    if (result.error) {
      console.warn('[CASHFREE CHECKOUT CLOSED/ERROR]', result.error);
      if (onError) onError(result.error);
      return result;
    }

    if (result.redirect) {
      console.log('[CASHFREE CHECKOUT REDIRECTING]', result.redirect);
    }

    if (onPaid) onPaid(result);
    return result;
  } catch (err) {
    console.error('[CASHFREE CHECKOUT EXCEPTION]', err);
    if (onError) onError(err);
    throw err;
  }
}
