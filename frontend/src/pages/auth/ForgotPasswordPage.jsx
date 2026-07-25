import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setResetSent(true);
    } catch (_err) {
      // Toast handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-400 flex items-center justify-center text-black shadow-lg shadow-yellow-500/20 mx-auto">
            <Sparkles className="w-6 h-6 fill-black" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Enter your account email to receive a password reset link.
          </p>
        </div>

        {resetSent ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Check your inbox</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
              If an account with <span className="font-semibold text-slate-700 dark:text-zinc-300">{email}</span> exists, password reset instructions have been sent.
            </p>
            <Link
              to="/login"
              className="inline-block mt-4 px-5 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-slate-50/50 dark:bg-zinc-800/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-extrabold text-sm shadow-lg shadow-yellow-500/25 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <>
                  Send Reset Link <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-500 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800">
          Remembered your password?{' '}
          <Link to="/login" className="font-bold text-yellow-600 dark:text-yellow-400 hover:underline">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
}
