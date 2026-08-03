import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Languages, Mic, Volume2, ArrowRight, Clapperboard } from 'lucide-react';

export default function AIToolCardGrid({
  setFacelessModalOpen,
  setDubbingModalOpen,
  setDemucsModalOpen,
  setVoiceCloningModalOpen,
}) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* FEATURED: RUKHI AI FILM STUDIO */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 border border-amber-500/40 shadow-2xl hover:border-amber-400 transition-all flex flex-col justify-between group col-span-1 md:col-span-2 lg:col-span-3">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Clapperboard className="w-6 h-6 text-amber-400" />
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
              🔥 Flagship AI OS
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              Rukhi AI Film Studio & Director Engine
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mt-2">
              Build long-form cinematic series with guaranteed character continuity, set location catalogs, canon rules enforcement, prompt compilation, and multi-agent preflight validation.
            </p>
          </div>
        </div>
        <div className="pt-6 border-t border-amber-500/20 mt-6 flex justify-end">
          <button
            onClick={() => navigate('/studio')}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Launch Rukhi Film Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* TOOL 1: FACELESS REEL GENERATOR */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl hover:border-yellow-500/50 transition-all flex flex-col justify-between group">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 fill-yellow-500" />
            </div>
            <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-black uppercase tracking-wider">
              Top Rated AI
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Faceless Video Reel Generator
          </h3>
          <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
            Generate complete viral shorts from a single topic prompt. Auto-creates AI scripts, selects stock video footage, synthesizes voiceover audio, and syncs kinetic subtitles.
          </p>
        </div>
        <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 mt-6">
          <button
            onClick={() => setFacelessModalOpen(true)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-extrabold text-xs shadow-md shadow-yellow-500/20 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Launch Generator Modal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOOL 2: MULTILINGUAL VOICE DUBBING STUDIO */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl hover:border-yellow-500/50 transition-all flex flex-col justify-between group">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <Languages className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider">
              Voice Synth
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Multilingual Voice Dubbing Studio
          </h3>
          <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
            Type text or record your voice to generate neural voice dubs in Telugu, Hindi, English, Spanish, Tamil, and Kannada using EdgeTTS, ElevenLabs, or Google TTS models.
          </p>
        </div>
        <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 mt-6">
          <button
            onClick={() => setDubbingModalOpen(true)}
            className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-zinc-800 border border-slate-700 dark:border-zinc-700 text-white font-extrabold text-xs hover:border-yellow-500/50 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Open Dubbing Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOOL 3: DEMUCS VOCAL SEPARATOR & TRANSCRIBER */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl hover:border-yellow-500/50 transition-all flex flex-col justify-between group">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-black uppercase tracking-wider">
              Demucs AI
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Audio Vocal Isolation & Transcriber
          </h3>
          <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
            Upload raw video or audio files up to 1GB. Meta Demucs strips background music while Deepgram Nova-2 & Gemini 2.5 Flash transcribe speech with 100% sync precision.
          </p>
        </div>
        <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 mt-6 space-y-2">
          <button
            onClick={() => setDemucsModalOpen(true)}
            className="w-full py-3 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs shadow-md shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>Open Demucs Isolator</span>
          </button>
        </div>
      </div>
    </div>
  );
}
