import React from 'react';
import { Shield, Lock, Eye, CheckCircle } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-zinc-800 pb-6">
        <div className="flex items-center space-x-3 text-cyan-500 mb-2">
          <Shield className="w-6 h-6" />
          <span className="text-sm font-semibold uppercase tracking-wider">Legal Compliance</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Privacy Policy</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
          Last updated: July 30, 2026 • Auto Captions AI (rukhi.in)
        </p>
      </div>

      {/* Main Body */}
      <div className="space-y-6 text-slate-700 dark:text-zinc-300 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Introduction</h2>
          <p>
            Welcome to Auto Captions AI ("rukhi.in", "we", "our", "us"). We provide cloud-based video subtitle editing, automated audio transcription, and content creator productivity software. Your privacy is paramount to us, and this Privacy Policy explains how we collect, use, and protect your information when you use our SaaS application.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, profile photo, and authentication credentials when you register or log in via Google OAuth.</li>
            <li><strong>User Uploaded Media:</strong> Audio and video files uploaded solely for transcription, subtitle generation, and video editing purposes.</li>
            <li><strong>Payment & Billing Data:</strong> Payment transaction IDs, plan subscription details, and billing receipts processed securely via licensed payment gateways (Razorpay / Cashfree / Stripe). We do not store raw credit card or debit card numbers on our servers.</li>
            <li><strong>Usage & System Analytics:</strong> Anonymous browser type, IP address, page views, and feature usage statistics to optimize software performance.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>To process audio waveform speech-to-text transcription and subtitle rendering.</li>
            <li>To manage user accounts, authentication, and credit allocations.</li>
            <li>To process subscription billing and issue official digital payment receipts.</li>
            <li>To provide customer support and respond to technical inquiries via support@rukhi.in.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Data Storage & Security</h2>
          <p>
            All media uploads and project metadata are encrypted in transit using SSL/TLS 256-bit encryption. Uploaded video and intermediate audio files are stored securely in isolated server storage and automatically purged after 72 hours via our automated cleanup daemon. We do not sell or trade user data to third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. Contact Us</h2>
          <p>
            If you have questions regarding this Privacy Policy or data requests, please contact our Compliance Team at:
          </p>
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono">
            Email: support@rukhi.in<br />
            Website: https://rukhi.in<br />
            Business Name: Auto Captions AI Software
          </div>
        </section>
      </div>
    </div>
  );
}
