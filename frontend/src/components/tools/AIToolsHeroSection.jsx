import React from 'react';
import { Wand2, Sparkles, Languages, Volume2, Film } from 'lucide-react';

export default function AIToolsHeroSection({
  setFacelessModalOpen,
  setDubbingModalOpen,
  setVoiceCloningModalOpen,
}) {
  return (
    <section className="relative pt-10 pb-12 px-4 max-w-7xl mx-auto text-center">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-yellow-500/15 via-amber-500/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-xs font-extrabold mb-6 backdrop-blur">
        <Wand2 className="w-4 h-4 text-yellow-500" />
        <span>AI POWER SUITE & MEDIA GENERATORS</span>
      </div>

      <h1 className="text-3xl sm:text-5xl font-black tracking-tight max-w-4xl mx-auto leading-tight mb-4">
        Launch Top-Grade <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent">AI Video & Voice Tools</span> Instantly
      </h1>

      <p className="text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto font-medium text-sm sm:text-base mb-8">
        Access all standalone AI generators without waiting to upload a video first. Generate faceless reels, synthesize voice dubs, search stock B-Roll overlays, and isolate audio vocals.
      </p>

      {/* Quick Launch Action Pills */}
      <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto">
        <button
          onClick={() => setFacelessModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-black" />
          <span>Faceless Reel Generator</span>
        </button>

        <button
          onClick={() => setDubbingModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-slate-900 dark:bg-zinc-800 border border-slate-700 dark:border-zinc-700 text-white font-extrabold text-xs hover:border-yellow-500/50 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Languages className="w-4 h-4 text-yellow-400" />
          <span>Voice Dubbing Studio</span>
        </button>

        <button
          onClick={() => setVoiceCloningModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-extrabold text-xs hover:bg-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Volume2 className="w-4 h-4 text-amber-500" />
          <span>1-2 Min AI Voice Cloning</span>
        </button>

        <button
          onClick={() => {
            const el = document.getElementById('broll-search-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="px-5 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Film className="w-4 h-4 text-yellow-500" />
          <span>Stock B-Roll Explorer</span>
        </button>
      </div>
    </section>
  );
}
