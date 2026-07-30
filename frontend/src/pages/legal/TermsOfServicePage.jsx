import React from 'react';
import { FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-zinc-800 pb-6">
        <div className="flex items-center space-x-3 text-cyan-500 mb-2">
          <FileText className="w-6 h-6" />
          <span className="text-sm font-semibold uppercase tracking-wider">Merchant Terms</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Terms of Service</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
          Last updated: July 30, 2026 • Auto Captions AI (rukhi.in)
        </p>
      </div>

      {/* Main Body */}
      <div className="space-y-6 text-slate-700 dark:text-zinc-300 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Auto Captions AI web application at <strong>rukhi.in</strong> ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not access or use the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Description of Service</h2>
          <p>
            Auto Captions AI provides cloud-based video editing software, automated speech-to-text captioning, kinetic typography formatting, and content creator productivity tools. Users can upload video files to transcribe speech, edit subtitles, render exported MP4 media files, and manage subscriptions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. User Conduct & Acceptable Use Policy</h2>
          <p>
            You agree to use the Service in compliance with all applicable laws and regulations. You shall NOT:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Upload media containing illegal content, hate speech, explicit violence, or defamatory material.</li>
            <li>Attempt to reverse engineer, decompile, or disrupt our cloud server infrastructure.</li>
            <li>Infringe upon third-party intellectual property or copyright rights.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Subscriptions & Billing</h2>
          <p>
            Access to certain features requires paid credits or monthly subscription plans (e.g. Starter Creator ₹199, Pro Unlimited ₹399). Payments are processed securely via authorized payment gateways (Razorpay / Cashfree / Stripe). All fees are quoted in Indian Rupees (INR) or USD.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. Limitation of Liability</h2>
          <p>
            Auto Captions AI is provided "as is" without warranty of any kind. Under no circumstances shall Auto Captions AI or its operators be liable for indirect, incidental, or consequential damages resulting from software use.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">6. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India, subject to the jurisdiction of competent courts in Telangana, India.
          </p>
        </section>
      </div>
    </div>
  );
}
