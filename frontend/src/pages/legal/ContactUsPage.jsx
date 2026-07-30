import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactUsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Please fill in all fields!');
      return;
    }
    setSubmitted(true);
    toast.success('Message sent! Our support team will reply within 24 hours.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-zinc-800 pb-6">
        <div className="flex items-center space-x-3 text-cyan-500 mb-2">
          <Mail className="w-6 h-6" />
          <span className="text-sm font-semibold uppercase tracking-wider">Customer Support</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Contact Us</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
          Have a question about subscriptions, video editing, or payments? We're here to help!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Contact Info Cards */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Official Business Contact</h3>
            
            <div className="flex items-start space-x-3 text-sm text-slate-600 dark:text-zinc-300">
              <Mail className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Email Support</div>
                <a href="mailto:support@rukhi.in" className="text-cyan-500 hover:underline">support@rukhi.in</a>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-sm text-slate-600 dark:text-zinc-300">
              <Clock className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Response SLA</div>
                <div>24/7 Monitoring • Replies within 24 hours</div>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-sm text-slate-600 dark:text-zinc-300">
              <MapPin className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Registered Address</div>
                <div>Auto Captions AI Software SaaS<br />Hyderabad, Telangana, India - 500081</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Message Received!</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Thank you for contacting Auto Captions AI support. Our team will review your inquiry and email you back at <strong>{email}</strong> within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Send Support Inquiry</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">Message / Inquiry</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you?"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
