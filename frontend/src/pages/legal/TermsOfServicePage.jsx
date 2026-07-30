import React from 'react';
import { FileText, ShieldAlert, CheckCircle, AlertTriangle, Lock } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-zinc-800 pb-6">
        <div className="flex items-center space-x-3 text-cyan-500 mb-2">
          <FileText className="w-6 h-6" />
          <span className="text-sm font-semibold uppercase tracking-wider">Merchant Terms & Acceptable Use</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Terms of Service & Compliance Policy</h1>
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

        <section className="space-y-3 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
          <h2 className="text-lg font-bold flex items-center space-x-2 text-amber-950 dark:text-amber-100">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <span>3. Strict Anti-Deepfake & Anti-Impersonation Policy</span>
          </h2>
          <p>
            Auto Captions AI enforces a zero-tolerance policy against deepfakes, unauthorized voice cloning, and deceptive identity manipulation. Users are strictly prohibited from:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li>Generating or editing media designed to impersonate public figures, government officials, celebrities, or private individuals without explicit written consent.</li>
            <li>Creating deceptive political propaganda, election interference material, or fraudulent financial advice videos.</li>
            <li>Using synthetic voiceovers or visuals to mislead, defraud, or blackmail any person.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. User Conduct & Zero Abusive Content Policy</h2>
          <p>
            You agree to use the Service in compliance with all applicable local, national, and international laws. You shall NOT upload, process, or render media containing:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Hate speech, discrimination, harassment, threats, or explicit violence.</li>
            <li>Adult explicit content, pornography, or sexually suggestive material.</li>
            <li>Defamatory, libelous, or illegal content violating third-party rights.</li>
            <li>Malicious code, spyware, or infrastructure disruption attempts.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. Copyright & Intellectual Property Protection</h2>
          <p>
            You retain all ownership rights to your original video content. By uploading media to our platform, you warrant that you hold all necessary copyright licenses and permissions. Auto Captions AI reserves the right to immediately terminate any user account flagged for copyright infringement without refund.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">6. Subscriptions, Payments & Billing</h2>
          <p>
            Access to certain features requires paid credits or monthly subscription plans (e.g. Starter Creator ₹199, Pro Unlimited ₹399). Payments are processed securely via licensed payment gateways (Razorpay / Cashfree / Stripe). All transactions are encrypted with SSL 256-bit security.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">7. Limitation of Liability & Governing Law</h2>
          <p>
            Auto Captions AI is provided "as is" without warranty of any kind. These Terms shall be governed by and construed in accordance with the laws of India, subject to the jurisdiction of competent courts in Telangana, India.
          </p>
        </section>
      </div>
    </div>
  );
}
