import React from 'react';
import { Sparkles, ArrowRight, Play, Zap, Globe, Film, ShieldCheck } from 'lucide-react';

export default function HomePageHero({ handleStartCreating }) {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 max-w-7xl mx-auto text-center">
      {/* Glowing Background Radial */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[350px] sm:h-[450px] bg-gradient-to-tr from-yellow-500/20 via-amber-500/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Top Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-xs sm:text-sm font-extrabold mb-8 backdrop-blur-md shadow-lg shadow-yellow-500/5 animate-pulse">
        <Sparkles className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        <span>Next-Gen Submagic & Opus Clip-Style AI Creator Engine</span>
        <span className="bg-yellow-500 text-black px-2 py-0.5 rounded-full text-[10px] uppercase font-black">v2.5 PRO</span>
      </div>

      {/* Main Title */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-[1.1] mb-6">
        Create Viral Short Reels with <br className="hidden sm:inline" />
        <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent drop-shadow-sm">
          Millisecond-Accurate
        </span> AI Captions
      </h1>

      {/* Subtitle */}
      <p className="text-base sm:text-xl text-slate-600 dark:text-zinc-400 max-w-3xl mx-auto font-medium leading-relaxed mb-10">
        Transform raw video into engaging short-form content for Instagram Reels, YouTube Shorts, and TikTok. 
        Powered by Gemini 2.5 Flash, Demucs AI Vocal Isolation, AI Stock B-Roll Overlays, and Voice Dubbing.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
        <button
          onClick={handleStartCreating}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black text-base shadow-xl shadow-yellow-500/25 hover:shadow-yellow-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group cursor-pointer"
        >
          <Sparkles className="w-5 h-5 fill-black group-hover:rotate-12 transition-transform" />
          <span>Start Studio Free</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => {
            const el = document.getElementById('features-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 font-bold text-base hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current text-yellow-500" />
          <span>Explore Capabilities</span>
        </button>
      </div>

      {/* Feature Pills Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto pt-6 border-t border-slate-200/60 dark:border-zinc-800/80">
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/60 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 backdrop-blur">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">100% Millisecond Sync</span>
        </div>
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/60 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 backdrop-blur">
          <Globe className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">70+ Google Fonts</span>
        </div>
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/60 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 backdrop-blur">
          <Film className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Stock B-Roll Overlays</span>
        </div>
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/60 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 backdrop-blur">
          <ShieldCheck className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">60FPS Lossless Export</span>
        </div>
      </div>
    </section>
  );
}
