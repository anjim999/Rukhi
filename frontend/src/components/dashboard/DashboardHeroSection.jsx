import React from 'react';
import { Volume2, Sparkles, Video, ArrowRight } from 'lucide-react';

const TELUGU_CAPTION_WORDS = [
  { text: 'Mee', highlight: false },
  { text: 'video', highlight: false },
  { text: 'ki', highlight: false },
  { text: 'సరైన', highlight: true },
  { text: 'క్యాప్షన్స్', highlight: true },
];

export default function DashboardHeroSection({
  activeWordIndex,
  setShowFacelessModal,
  user,
  openAuthModal,
  scrollToUpload,
}) {
  return (
    <div className="rounded-3xl bg-gradient-to-b from-slate-100 to-slate-50 dark:from-zinc-900/80 dark:to-zinc-900/40 border border-slate-200 dark:border-zinc-800 p-6 sm:p-10 text-center space-y-6 sm:space-y-8 relative overflow-hidden shadow-xl backdrop-blur-md">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-yellow-500/10 dark:bg-yellow-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 text-xs font-bold shadow-xs">
        <Sparkles className="w-3.5 h-3.5 fill-yellow-500" />
        Built for Telugu creators
      </div>

      <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
          For Telugu creators
        </h1>
        <h2 className="text-lg sm:text-2xl font-extrabold text-yellow-600 dark:text-yellow-400">
          Word-by-word Telugu captions for Reels and Shorts.
        </h2>
        <p className="text-xs sm:text-base text-slate-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          Telugu captions that don't look like a robot wrote them, burned into your export in under a minute.
        </p>
      </div>

      {/* Word-by-word Kinetic Caption Preview */}
      <div className="max-w-md mx-auto my-4 sm:my-6 p-4 sm:p-6 rounded-2xl bg-black/80 border border-zinc-800 shadow-2xl space-y-3 sm:space-y-4 backdrop-blur">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-b border-zinc-800 pb-2">
          <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Audio Sync
          </span>
          <span>Tanglish & Telugu AI</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 py-2 sm:py-4 min-h-[60px] sm:min-h-[70px]">
          {TELUGU_CAPTION_WORDS.map((w, index) => {
            const isActive = index === activeWordIndex;
            return (
              <span
                key={index}
                className={`text-xl sm:text-3xl font-black tracking-wide transition-all duration-300 ${
                  isActive
                    ? 'scale-110 text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]'
                    : w.highlight
                    ? 'text-yellow-500/90'
                    : 'text-zinc-400'
                }`}
              >
                {w.text}
              </span>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-semibold text-zinc-400 pt-2 border-t border-zinc-800">
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
            Tanglish
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            Actual export · word-by-word
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
            Audio
          </span>
        </div>
      </div>

      {/* CTA Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1 sm:pt-2">
        <button
          onClick={() => setShowFacelessModal(true)}
          className="flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 min-h-[48px] rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-purple-600/30 hover:brightness-110 active:scale-95 transition cursor-pointer border border-purple-400/30"
        >
          <Video className="w-4 h-4 text-purple-200" />
          <span>🎬 Generate AI Faceless Reel ($0)</span>
        </button>

        <button
          onClick={() => {
            if (!user) {
              openAuthModal('register');
            } else {
              scrollToUpload();
            }
          }}
          className="flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 min-h-[48px] rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-extrabold text-xs sm:text-sm shadow-xl shadow-yellow-500/30 hover:brightness-105 active:scale-95 transition cursor-pointer"
        >
          Upload Video <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Creator Attribution Credit */}
      <div className="pt-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-2">
        <span>Built for Telugu creators</span>
        <span>•</span>
        <span className="text-yellow-600 dark:text-yellow-400 font-bold">Built by @ssktechy</span>
      </div>
    </div>
  );
}
