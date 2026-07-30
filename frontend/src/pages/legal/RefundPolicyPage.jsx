import React from 'react';
import { RefreshCw, CreditCard, CheckCircle } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-zinc-800 pb-6">
        <div className="flex items-center space-x-3 text-cyan-500 mb-2">
          <RefreshCw className="w-6 h-6" />
          <span className="text-sm font-semibold uppercase tracking-wider">Merchant Policy</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Cancellation & Refund Policy</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
          Last updated: July 30, 2026 • Auto Captions AI (rukhi.in)
        </p>
      </div>

      {/* Main Body */}
      <div className="space-y-6 text-slate-700 dark:text-zinc-300 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Subscription Cancellation</h2>
          <p>
            You may cancel your Auto Captions AI plan subscription at any time directly from your <strong>Settings ➔ Subscription</strong> dashboard. Upon cancellation, your account will remain active until the end of your current paid billing cycle, and no further recurring charges will be initiated.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Refund Eligibility & Criteria</h2>
          <p>
            We strive for complete customer satisfaction with our video subtitle editor software. You are eligible for a full refund under the following conditions:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Duplicate Payment:</strong> If you were accidentally charged twice for the same transaction due to a payment gateway processing delay.</li>
            <li><strong>Technical Failure:</strong> If a technical issue on our server prevented you from processing or exporting media files and our support team is unable to resolve it within 48 hours.</li>
            <li><strong>7-Day Money-Back Guarantee:</strong> First-time subscribers who have processed less than 2 video exports may request a full refund within 7 days of initial subscription purchase.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Refund Processing Timeline</h2>
          <p>
            Once a refund request is approved by our billing department:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Refunds are credited back directly to the original payment source (Credit Card, Debit Card, NetBanking, or UPI).</li>
            <li>Refund processing takes <strong>5 to 7 business days</strong> to reflect on your bank or card statement as per banking standards.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. How to Request a Refund</h2>
          <p>
            To request a refund, please send an email to <strong>support@rukhi.in</strong> with the subject line <em>"Refund Request - [Your Registered Email / Transaction ID]"</em>. Our billing team will respond within 24 hours.
          </p>
        </section>
      </div>
    </div>
  );
}
