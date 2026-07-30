import React from 'react';
import { RefreshCw, CreditCard, CheckCircle, ShieldCheck, Clock, HelpCircle } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-zinc-800 pb-6">
        <div className="flex items-center space-x-3 text-cyan-500 mb-2">
          <RefreshCw className="w-6 h-6" />
          <span className="text-sm font-semibold uppercase tracking-wider">Customer Guarantee</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Cancellation & Refund Policy</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
          Last updated: July 30, 2026 • Auto Captions AI (rukhi.in)
        </p>
      </div>

      {/* Main Body */}
      <div className="space-y-6 text-slate-700 dark:text-zinc-300 text-sm leading-relaxed">
        
        {/* Highlight Card */}
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-100 flex items-start space-x-4">
          <ShieldCheck className="w-8 h-8 text-emerald-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">7-Day No-Questions-Asked Money Back Guarantee</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1">
              We stand behind our software quality. If you are not 100% satisfied with your subscription, you can request a full 100% refund within 7 days of purchase.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Instant Subscription Cancellation</h2>
          <p>
            You may cancel your Auto Captions AI subscription at any time with <strong>zero hidden fees</strong> directly from your account dashboard (<strong>Settings ➔ Subscription</strong>). Upon cancellation:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li>Your plan remain active until the end of your current paid billing period.</li>
            <li>No further recurring charges will ever be initiated on your payment card or UPI ID.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Full Refund Eligibility & Criteria</h2>
          <p>
            A 100% full refund is guaranteed under the following conditions:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>7-Day Trial Guarantee:</strong> First-time subscribers who request a refund within 7 days of purchase.</li>
            <li><strong>Duplicate Charges:</strong> If you were accidentally charged twice for the same transaction due to payment gateway network delays, we issue an immediate 100% refund for the duplicate transaction.</li>
            <li><strong>Service Outage:</strong> If a technical failure on our cloud servers prevented you from processing or exporting media files and our support team cannot resolve it within 48 hours.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Refund Processing & Bank Timeline</h2>
          <p>
            All approved refunds are credited directly back to your original payment source (UPI, Credit Card, Debit Card, or NetBanking):
          </p>
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center space-x-2 font-semibold text-slate-900 dark:text-white">
              <Clock className="w-4 h-4 text-cyan-500" />
              <span>Standard Banking Timeline: 5 to 7 Business Days</span>
            </div>
            <p className="text-slate-500 dark:text-zinc-400">
              Once initiated by our billing team, funds take 5–7 business days to reflect on your bank or credit card statement as per Reserve Bank of India (RBI) payment gateway processing rules.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. How to Request a Refund</h2>
          <p>
            To request a refund, simply send an email to <strong>support@rukhi.in</strong> with your registered account email and transaction ID. Our billing department processes all refund requests within 24 hours.
          </p>
        </section>

      </div>
    </div>
  );
}
