import React, { useState } from 'react';
import { Sparkles, X, Mail, Lock, User, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal() {
  const {
    authModalOpen,
    authModalView,
    setAuthModalView,
    closeAuthModal,
    login,
    register,
    googleAuth,
    forgotPassword,
  } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleGoogleOAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!termsAccepted) {
        toast.error('Please accept the Terms of Service to proceed.');
        return;
      }
      setIsSubmitting(true);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await userInfoRes.json();
        await googleAuth({
          googleId: googleUser.sub,
          email: googleUser.email,
          name: googleUser.name,
          avatarUrl: googleUser.picture,
        });
      } catch (err) {
        console.error('Google OAuth Error:', err);
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: (err) => console.error('Google Login Failed:', err),
  });

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error('Please accept the Terms of Service to proceed.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (authModalView === 'login') {
        await login(email, password);
      } else if (authModalView === 'register') {
        await register(name, email, password);
      } else if (authModalView === 'forgot') {
        await forgotPassword(email);
        setResetSent(true);
      }
    } catch (_err) {
      // Error handled by AuthContext toasts
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      // Simulate/trigger Google Auth payload or prompt
      const mockGoogleEmail = email || `user_${Math.floor(Math.random() * 10000)}@gmail.com`;
      await googleAuth({
        googleId: `google_${Date.now()}`,
        email: mockGoogleEmail,
        name: name || 'Google User',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(mockGoogleEmail)}`,
      });
    } catch (_err) {
      // Error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden transition-all transform scale-100">
        
        {/* Top Glow & Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50">
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-400 flex items-center justify-center text-black shadow-md shadow-yellow-500/20">
              <Sparkles className="w-4 h-4 fill-black" />
            </div>
            <span className="font-bold text-xs uppercase tracking-widest text-yellow-500">
              RoCaps Pro
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {authModalView === 'login' && 'Sign in to your account'}
            {authModalView === 'register' && 'Create your free account'}
            {authModalView === 'forgot' && 'Reset your password'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {authModalView === 'login' && 'Access all your viral reels, AI captions, and exports.'}
            {authModalView === 'register' && 'Generate 60FPS broadcast-grade captions in seconds.'}
            {authModalView === 'forgot' && 'Enter your account email to receive reset instructions.'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">

          {authModalView === 'forgot' && resetSent ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Check your email</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
                We've sent password reset instructions to <span className="font-semibold text-slate-700 dark:text-zinc-300">{email}</span>.
              </p>
              <button
                type="button"
                onClick={() => { setResetSent(false); setAuthModalView('login'); }}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Google Button for Login / Register */}
              {authModalView !== 'forgot' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleGoogleOAuth()}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-100/80 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 font-bold text-sm hover:bg-slate-200 dark:hover:bg-zinc-700 transition shadow-sm cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="relative flex items-center justify-center my-2">
                    <div className="w-full border-t border-slate-200 dark:border-zinc-800"></div>
                    <span className="absolute px-3 bg-white dark:bg-zinc-900 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      or with email
                    </span>
                  </div>
                </>
              )}

              {/* Name input for Register */}
              {authModalView === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-slate-50/50 dark:bg-zinc-800/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition"
                    />
                  </div>
                </div>
              )}

              {/* Email input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-slate-50/50 dark:bg-zinc-800/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition"
                  />
                </div>
              </div>

              {/* Password input */}
              {authModalView !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Password
                    </label>
                    {authModalView === 'login' && (
                      <button
                        type="button"
                        onClick={() => setAuthModalView('forgot')}
                        className="text-[11px] font-semibold text-yellow-600 dark:text-yellow-400 hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder={authModalView === 'register' ? 'Create password' : 'Enter your password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-slate-50/50 dark:bg-zinc-800/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition"
                    />
                  </div>
                </div>
              )}

              {/* Terms and Conditions Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modal-terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-yellow-500 focus:ring-yellow-500/50 cursor-pointer"
                />
                <label htmlFor="modal-terms" className="text-[11px] text-slate-600 dark:text-zinc-400 cursor-pointer select-none">
                  I agree to the <span className="font-semibold text-slate-900 dark:text-zinc-200 underline">Terms of Service</span> & <span className="font-semibold text-slate-900 dark:text-zinc-200 underline">Privacy Policy</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-extrabold text-sm shadow-lg shadow-yellow-500/25 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 transition"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <>
                    {authModalView === 'login' && 'Sign In'}
                    {authModalView === 'register' && 'Create Account'}
                    {authModalView === 'forgot' && 'Send Reset Email'}
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer View Switch */}
          <div className="pt-2 text-center text-xs text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/80">
            {authModalView === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalView('register')}
                  className="font-bold text-yellow-600 dark:text-yellow-400 hover:underline"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalView('login')}
                  className="font-bold text-yellow-600 dark:text-yellow-400 hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
