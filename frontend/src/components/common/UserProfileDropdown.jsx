import React from 'react';
import { User, Sparkles, HelpCircle, Pencil, LogOut, Crown, Zap, MessageSquare, Headphones } from 'lucide-react';

export default function UserProfileDropdown({
  user,
  onClose,
  navigate,
  setShowPricingModal,
  setShowFeedbackModal,
  onOpenTour,
  setShowSupportModal,
  handleOpenProfileModal,
  setShowLogoutModal,
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-2.5 z-50 animate-fadeIn space-y-1">
        {/* Header info */}
        <div className="px-3.5 py-3 border-b border-slate-100 dark:border-zinc-800 space-y-2">
          <div className="flex items-center gap-3">
            {(user.avatar_url || user.avatar || user.picture) ? (
              <img
                src={user.avatar_url || user.avatar || user.picture}
                alt={user.name || 'User'}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-amber-400/50 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-yellow-500 text-black font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0">
                {(user.name || 'User').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{user.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{user.email}</p>
            </div>
          </div>

          {/* Plan & Credits Badge */}
          <div className="flex items-center justify-between pt-1">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${
              user.plan === 'dubbing_studio' || user.plan === 'pro'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                : user.plan === 'starter' || user.plan === 'plus' || user.plan === 'basic'
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
            }`}>
              {user.plan === 'dubbing_studio' ? (
                <>
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span>Dubbing Studio</span>
                </>
              ) : user.plan === 'pro' ? (
                <>
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span>Pro 60s</span>
                </>
              ) : user.plan === 'starter' || user.plan === 'plus' ? (
                <>
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Plus 30s</span>
                </>
              ) : user.plan === 'basic' ? (
                <>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Basic</span>
                </>
              ) : (
                <span>Free Tier</span>
              )}
            </span>
            <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
              {user.credits !== undefined && user.credits !== null ? (
                user.credits > 9999 ? (
                  <>
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Unlimited</span>
                  </>
                ) : (
                  `${user.credits} Credits`
                )
              ) : (
                '3 Credits'
              )}
            </span>
          </div>
        </div>

        {/* Account Settings */}
        <button
          onClick={() => {
            onClose();
            navigate('/settings');
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 rounded-2xl transition cursor-pointer"
        >
          <User className="w-4 h-4 text-amber-500" />
          <span>Account & Settings</span>
        </button>

        {/* Upgrade Plan */}
        <button
          onClick={() => {
            onClose();
            setShowPricingModal(true);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-amber-500 hover:bg-amber-500/10 rounded-2xl transition cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span>Upgrade Plan & Credits</span>
        </button>

        {/* Share Feedback */}
        <button
          onClick={() => {
            onClose();
            setShowFeedbackModal(true);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-pink-500 hover:bg-pink-500/10 rounded-2xl transition cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-pink-500" />
          <span>Share Feedback</span>
        </button>

        {/* Product Tour */}
        <button
          onClick={() => {
            onClose();
            onOpenTour();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl transition cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 text-yellow-500" />
          <span>Interactive Product Tour</span>
        </button>

        {/* Support Desk */}
        <button
          onClick={() => {
            onClose();
            setShowSupportModal(true);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 rounded-2xl transition cursor-pointer"
        >
          <Headphones className="w-4 h-4 text-indigo-400" />
          <span>Engineering Support</span>
        </button>

        {/* Edit Display Name */}
        <button
          onClick={handleOpenProfileModal}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl transition cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5 text-slate-400" />
          <span>Edit Profile Name</span>
        </button>

        {/* Sign Out */}
        <button
          onClick={() => {
            onClose();
            setShowLogoutModal(true);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-2xl transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );
}
