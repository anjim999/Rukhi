import React from 'react';
import { FolderOpen, Wand2, Sparkles } from 'lucide-react';

export default function HeaderNavLinks({
  isDashboard,
  isAITools,
  navigate,
  setShowPricingModal,
  setShowGuideModal,
}) {
  return (
    <div className="hidden md:flex items-center gap-1.5">
      <button
        onClick={() => navigate('/dashboard')}
        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-extrabold transition-all cursor-pointer border ${
          isDashboard
            ? 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30 shadow-sm'
            : 'border-transparent text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
        }`}
      >
        <FolderOpen className="w-4 h-4 text-yellow-500" />
        <span>Dashboard</span>
      </button>

      <button
        onClick={() => navigate('/ai-studio')}
        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-extrabold transition-all cursor-pointer border ${
          isAITools
            ? 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30 shadow-sm'
            : 'border-transparent text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
        }`}
      >
        <Wand2 className="w-4 h-4 text-yellow-500" />
        <span>AI Studio</span>
      </button>

      <button
        onClick={() => setShowPricingModal(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-extrabold border border-transparent text-slate-600 dark:text-zinc-300 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span>Pricing</span>
      </button>

      <button
        onClick={() => setShowGuideModal(true)}
        title="Creator Master Guide & Documentation"
        className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-extrabold border border-transparent text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
      >
        <span>📖 Guide</span>
      </button>
    </div>
  );
}
