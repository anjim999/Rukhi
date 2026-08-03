import React from 'react';
import { Sparkles, FolderOpen, Wand2, User } from 'lucide-react';

export default function HeaderMobileDrawer({
  mobileMenuOpen,
  setMobileMenuOpen,
  navigate,
  user,
  setShowLogoutModal,
  openAuthModal,
  isStudio
}) {
  if (!mobileMenuOpen) return null;

  return (
    <div className="md:hidden border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-4 space-y-3 shadow-2xl animate-fadeIn">
      <button
        onClick={() => {
          navigate('/');
          setMobileMenuOpen(false);
        }}
        className="w-full flex items-center justify-between p-3.5 min-h-[48px] rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold text-sm active:scale-[0.99] transition cursor-pointer"
      >
        <span className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          Home Page
        </span>
      </button>

      <button
        onClick={() => {
          navigate('/dashboard');
          setMobileMenuOpen(false);
        }}
        className="w-full flex items-center justify-between p-3.5 min-h-[48px] rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold text-sm active:scale-[0.99] transition cursor-pointer"
      >
        <span className="flex items-center gap-2.5">
          <FolderOpen className="w-5 h-5 text-yellow-500" />
          Studio Dashboard & Projects
        </span>
      </button>

      <button
        onClick={() => {
          navigate('/ai-studio');
          setMobileMenuOpen(false);
        }}
        className="w-full flex items-center justify-between p-3.5 min-h-[48px] rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-extrabold text-sm active:scale-[0.99] transition cursor-pointer"
      >
        <span className="flex items-center gap-2.5">
          <Wand2 className="w-5 h-5 text-yellow-500" />
          AI Studio Hub
        </span>
        <span className="bg-yellow-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
          NEW
        </span>
      </button>

      <button
        onClick={() => {
          navigate('/studio');
          setMobileMenuOpen(false);
        }}
        className={`w-full flex items-center justify-between p-3.5 min-h-[48px] rounded-2xl font-extrabold text-sm active:scale-[0.99] transition cursor-pointer border ${
          isStudio
            ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-500 shadow-md shadow-amber-500/10'
            : 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white border-transparent hover:text-amber-500'
        }`}
      >
        <span className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
          Rukhi AI Film Studio
        </span>
        <span className="bg-amber-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
          HOT
        </span>
      </button>

      {user ? (
        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-extrabold text-sm text-slate-900 dark:text-white">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{user.email}</p>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowLogoutModal(true);
              }}
              className="px-4 py-2 min-h-[40px] text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-500/20 rounded-xl active:scale-95 transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/settings');
            }}
            className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <User className="w-4 h-4 text-amber-500" />
            <span>Account & Settings</span>
          </button>
        </div>
      ) : (
        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center gap-3">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              openAuthModal('login');
            }}
            className="flex-1 py-3 min-h-[44px] rounded-2xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-800 dark:text-zinc-200 text-center active:scale-95 transition cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              openAuthModal('register');
            }}
            className="flex-1 py-3 min-h-[44px] rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-extrabold text-center shadow-lg shadow-yellow-500/20 active:scale-95 transition cursor-pointer"
          >
            Get Started
          </button>
        </div>
      )}
    </div>
  );
}
