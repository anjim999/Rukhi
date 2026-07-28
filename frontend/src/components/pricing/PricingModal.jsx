import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Zap, Check, ShieldCheck, Sparkles, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

export default function PricingModal({ isOpen, onClose, user: propUser, onPlanUpgraded }) {
  const { user: authUser, setUser, refreshUser } = useAuth();
  const user = authUser || propUser;

  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isOpen) return null;

  const plans = [
    {
      id: 'free',
      name: 'Free Tier',
      price: '₹0',
      period: 'forever',
      description: 'Ideal for trying out rukhi.in captioning',
      exports: '3 Videos / month',
      features: ['720p HD Video Export', 'Watermark Included', 'Standard Fonts Suite', 'Manual Subtitle Sync'],
      buttonText: 'Current Plan',
      isCurrent: user?.plan === 'free' || !user?.plan,
      popular: false,
    },
    {
      id: 'starter',
      name: 'Starter Creator',
      price: '₹199',
      period: '/ month',
      description: 'Perfect for social media creators & reel editors',
      exports: '25 Videos / month',
      features: ['1080p Full HD Export', 'NO Watermark', '70+ Typography & Font Studio', 'Ripple Sync & Nudge Controls', 'Email Support'],
      buttonText: 'Upgrade to Starter',
      isCurrent: user?.plan === 'starter',
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro Unlimited',
      price: '₹399',
      period: '/ month',
      description: 'Built for agencies, viral reel creators & power users',
      exports: 'Unlimited Videos',
      features: [
        '4K 60FPS Ultra-HD Export',
        'Multilingual AI Voice Dubbing Studio',
        'AI B-Roll Engine (Stock Clips)',
        'Meta Demucs Vocal Separator',
        'VIP Priority Rendering Queue',
        '24/7 Priority Support',
      ],
      buttonText: 'Upgrade to Pro Unlimited',
      isCurrent: user?.plan === 'pro',
      popular: true,
    },
  ];

  const handleSelectPlan = async (planId) => {
    if (planId === 'free') return;

    try {
      setLoadingPlan(planId);
      setError(null);
      console.log(`[PRICING MODAL] Initiating plan selection: ${planId}`);

      // 1. Create Payment Order on Backend
      const orderRes = await axiosClient.post('/payments/create-order', {
        planId,
        userId: user?.id || '00000000-0000-0000-0000-000000000001',
        gateway: 'razorpay',
      });

      console.log('[PRICING MODAL] Order response from backend:', orderRes);

      const orderData = orderRes?.data || orderRes;

      if (!orderData?.success) {
        console.error('[PRICING MODAL] Order creation failed:', orderData);
        throw new Error(orderData?.error || 'Failed to create payment order');
      }

      const { orderId, amount, currency, keyId } = orderData;
      console.log('[PRICING MODAL] Order details:', { orderId, amount, currency, keyId, windowRazorpay: Boolean(window.Razorpay) });

      // Launch Razorpay popup if keyId is present and Razorpay SDK is loaded
      if (window.Razorpay && keyId) {
        const options = {
          key: keyId,
          amount: amount,
          currency: currency,
          name: 'rukhi.in AI Studio',
          description: `Upgrade to ${plans.find((p) => p.id === planId)?.name}`,
          order_id: orderId,
          handler: async (response) => {
            console.log('[PRICING MODAL] Razorpay payment success response:', response);
            await verifyAndActivatePlan(planId, orderId, response.razorpay_payment_id, response.razorpay_signature);
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#f59e0b',
          },
        };
        console.log('[PRICING MODAL] Opening Razorpay instance with options:', options);
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          console.error('[PRICING MODAL] Razorpay payment.failed event:', resp.error);
          setError(resp.error?.description || 'Payment failed.');
        });
        rzp.open();
      } else {
        console.warn('[PRICING MODAL] Razorpay SDK missing or no keyId provided. Falling back to test activation mode.');
        await verifyAndActivatePlan(planId, orderId, `pay_test_${Date.now()}`, 'test_sig');
      }
    } catch (err) {
      console.error('[PRICING MODAL] Error in handleSelectPlan:', err);
      setError(err.message || 'Payment initiation error');
    } finally {
      setLoadingPlan(null);
    }
  };

  const verifyAndActivatePlan = async (planId, orderId, paymentId, signature) => {
    try {
      console.log('[PRICING MODAL] Verifying payment:', { planId, orderId, paymentId, signature });
      const verifyRes = await axiosClient.post('/payments/verify', {
        userId: user?.id || '00000000-0000-0000-0000-000000000001',
        orderId,
        paymentId,
        signature,
        planId,
      });

      console.log('[PRICING MODAL] Verify response from backend:', verifyRes);
      const verifyData = verifyRes?.data || verifyRes;

      if (verifyData?.success) {
        const planObj = plans.find((p) => p.id === planId);
        const successText = `🎉 Successfully upgraded to ${planObj?.name || planId}!`;
        setSuccessMessage(successText);
        toast.success(successText);
        console.log('[PRICING MODAL] Plan successfully activated:', verifyData);

        if (setUser) {
          setUser((prev) => (prev ? { ...prev, plan: planId, credits: verifyData?.credits ?? prev.credits } : prev));
        }
        if (refreshUser) {
          refreshUser();
        }
        if (onPlanUpgraded) onPlanUpgraded(planId);
      } else {
        console.error('[PRICING MODAL] Payment verification returned failure:', verifyData);
        setError(verifyData?.error || 'Payment verification failed');
      }
    } catch (err) {
      console.error('[PRICING MODAL] Error in verifyAndActivatePlan:', err);
      setError('Verification network error');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-md p-4 sm:p-6 md:p-10 flex items-center justify-center min-h-screen">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[88vh] my-auto">
        {/* Top Header */}
        <div className="shrink-0 flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-6 h-6 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Choose Your rukhi.in Plan</h2>
              <p className="text-xs text-slate-400">Unlock 4K 60FPS Export, AI Voice Dubbing, and Priority Queues</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {error && (
            <div className="mb-6 flex items-center gap-2 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 flex items-center gap-2 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-6 rounded-3xl border transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900 border-indigo-500/50 shadow-xl shadow-indigo-500/10 scale-105'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-indigo-500 text-black font-extrabold text-[10px] uppercase tracking-widest shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mb-4 min-h-[32px]">{plan.description}</p>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-xs text-slate-400 font-medium">{plan.period}</span>
                  </div>

                  <div className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-800/80 mb-6 inline-block">
                    <span className="text-xs font-bold text-indigo-400">Quota: {plan.exports}</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <div className="mt-0.5 p-0.5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  disabled={plan.isCurrent || loadingPlan === plan.id}
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full py-3 rounded-2xl font-bold text-xs transition-all shadow-lg ${
                    plan.isCurrent
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : plan.popular
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-500/25'
                      : 'bg-white hover:bg-slate-200 text-slate-900'
                  }`}
                >
                  {loadingPlan === plan.id ? 'Processing...' : plan.isCurrent ? 'Current Active Plan' : plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="shrink-0 px-8 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure 256-bit Encrypted Checkout via Razorpay & Stripe</span>
          </div>
          <span>Cancel or switch plans anytime</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
