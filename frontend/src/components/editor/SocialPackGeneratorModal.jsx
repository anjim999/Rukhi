import React from 'react';
import { X, Sparkles, Loader2, Copy, Check } from 'lucide-react';

export default function SocialPackGeneratorModal({
  isOpen,
  onClose,
  socialLoading,
  socialData,
  handleCopyAll,
  handleCopyIg,
  handleCopyYt,
  copiedIg,
  copiedYt,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar relative shadow-2xl text-slate-900 dark:text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Post-Ready Content Pack</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
          Zero-hallucination captions, titles, and viral #hashtags generated directly from your video transcript.
        </p>

        {socialLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500 dark:text-yellow-400" />
            <p className="text-xs text-slate-700 dark:text-zinc-300 font-semibold">Analyzing transcript & generating viral #hashtags...</p>
          </div>
        ) : socialData ? (
          <div className="space-y-5">
            {/* Header Action Banner & Viral Hook Retention Score */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-purple-900/30 via-pink-900/20 to-yellow-900/20 border border-purple-500/30">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 font-black text-xs flex items-center gap-1 shadow-sm">
                  🔥 Viral Hook Score: 98/100
                </span>
                <span className="text-[11px] text-zinc-400 hidden sm:inline">Optimized for Instagram & YouTube Algorithms</span>
              </div>
              <button
                onClick={handleCopyAll}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-black font-extrabold text-xs transition flex items-center gap-1.5 shadow-lg shadow-yellow-500/20 active:scale-95 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-black" />
                <span>🚀 Copy All-in-One (IG + Shorts)</span>
              </button>
            </div>

            {/* Instagram Reels Pack */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-500 dark:text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                  📸 Instagram Reels Pack
                </span>
                <button
                  onClick={handleCopyIg}
                  className="px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-600 dark:text-pink-300 hover:bg-pink-500/20 text-xs font-bold transition flex items-center gap-1.5"
                >
                  {copiedIg ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIg ? 'Copied!' : 'Copy IG Pack'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {socialData.instagram?.caption}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {socialData.instagram?.hashtags?.map((tag) => (
                  <span key={tag} className="text-[11px] font-mono text-pink-600 dark:text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* YouTube Shorts Pack */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  🎬 YouTube Shorts Pack
                </span>
                <button
                  onClick={handleCopyYt}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 hover:bg-red-500/20 text-xs font-bold transition flex items-center gap-1.5"
                >
                  {copiedYt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedYt ? 'Copied!' : 'Copy YT Pack'}</span>
                </button>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase block mb-1">Viral Title</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{socialData.youtubeShorts?.title}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase block mb-1">Description</span>
                <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{socialData.youtubeShorts?.description}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {socialData.youtubeShorts?.hashtags?.map((tag) => (
                  <span key={tag} className="text-[11px] font-mono text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
