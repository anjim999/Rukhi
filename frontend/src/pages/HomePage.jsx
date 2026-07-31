import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Video, 
  Wand2, 
  Zap, 
  Mic, 
  Film, 
  Globe, 
  Languages, 
  Sliders, 
  ArrowRight, 
  Play, 
  ShieldCheck, 
  Cpu, 
  Type, 
  Subtitles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import HomePageHero from '../components/home/HomePageHero';

export default function HomePage() {
  const navigate = useNavigate();
  const { openAuthModal } = useAuth();

  const handleStartCreating = () => {
    navigate('/dashboard');
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen text-slate-900 dark:text-zinc-100 transition-colors duration-300">
      
import HomePageHero from '../components/home/HomePageHero';

// ... inside render
      <HomePageHero handleStartCreating={handleStartCreating} />

      {/* LIVE STUDIO DEMO PREVIEW CARD */}
      <section className="px-4 max-w-6xl mx-auto pb-24">
        <div className="relative rounded-3xl bg-slate-900 dark:bg-zinc-900 border border-slate-800 dark:border-zinc-800 p-4 sm:p-8 shadow-2xl overflow-hidden group">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
              <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80" />
              <div className="w-3.5 h-3.5 rounded-full bg-green-500/80" />
              <span className="ml-2 text-xs font-mono font-bold text-zinc-400">AutoCaptions Studio Pro — Live Player Preview</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-extrabold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HTML5 Canvas 60FPS Sync</span>
            </div>
          </div>

          {/* Interactive Mock Canvas Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Reel Video Container (9:16 Mockup) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-[280px] sm:w-[320px] h-[500px] rounded-3xl bg-zinc-950 border-4 border-zinc-800 shadow-2xl overflow-hidden flex flex-col justify-between p-6">
                
                {/* Top Banner Hook Mock */}
                <div className="w-full bg-yellow-400 text-black font-black text-center py-2 px-3 rounded-xl shadow-lg transform -rotate-1 text-sm tracking-tight border-2 border-black">
                  🔥 UNLOCK VIRAL REEL GROWTH
                </div>

                {/* Subtitle Karaoke Dynamic Preview */}
                <div className="text-center my-auto space-y-3">
                  <div className="inline-block px-4 py-2 rounded-2xl bg-zinc-900/90 border border-yellow-500/40 shadow-xl backdrop-blur-md">
                    <p className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2 flex-wrap">
                      <span>THIS</span>
                      <span className="px-2 py-0.5 rounded-lg bg-yellow-500 text-black shadow-md shadow-yellow-500/50 scale-110 transform font-black uppercase">
                        AI ENGINE
                      </span>
                      <span>SYNCS</span>
                    </p>
                    <p className="text-lg font-extrabold text-yellow-400 tracking-wider uppercase mt-1">
                      EVERY SINGLE WORD ⚡
                    </p>
                  </div>
                </div>

                {/* Mobile Bottom Dock Mock */}
                <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between text-zinc-400 text-xs font-bold backdrop-blur">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Subtitles className="w-4 h-4" />
                    <span>Hormozi Gold</span>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-yellow-500/20 text-yellow-400 text-[10px] font-mono">02:14.05s</span>
                </div>
              </div>
            </div>

            {/* Feature Highlights beside Preview */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Designed for Modern Short-Form Content Creators
                </h3>
                <p className="text-sm sm:text-base text-zinc-400">
                  Stop spending hours manually placing subtitles and syncing audio in traditional video editors. Auto Captions AI handles everything automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-white">Microsecond Sync Engine</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Continuous monotonic timing repair prevents text overlap, micro-gaps, and boundary flickers.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Film className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-white">Stock B-Roll Auto-Insert</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    AI automatically analyzes speech concepts to insert stock visual video clips from Pexels & Pixabay.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-white">Telugu, Hindi & English</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Native Devanagari script, Telugu script, and Latin script Google Fonts with live font search popovers.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Languages className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-white">Multilingual Voice Dubbing</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Translate speech and generate multi-track neural voice dubs with pitch and rate controls.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID SECTION */}
      <section id="features-section" className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-yellow-500 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
            Engineered For Virality
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Everything You Need to Scale Short-Form Views
          </h2>
          <p className="text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto font-medium text-base">
            From automated transcription to AI stock overlays, custom typography, and 60FPS lossless export.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl hover:border-yellow-500/50 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-400 text-black flex items-center justify-center font-bold shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Demucs & Deepgram STT</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
              Meta Demucs isolates vocals from heavy background music while Deepgram Nova-2 and Gemini 2.5 Flash deliver accurate speech transcription with zero silence gap errors.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl hover:border-yellow-500/50 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-400 text-black flex items-center justify-center font-bold shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
              <Wand2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Faceless Reel Generator</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
              Turn topic prompts into complete viral shorts. Auto-generates script content, background video footage, audio voiceover narration, and kinetic subtitles in seconds.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl hover:border-yellow-500/50 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-400 text-black flex items-center justify-center font-bold shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
              <Film className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">AI Stock B-Roll Search</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
              Contextually searches stock media libraries (Pexels / Pixabay) based on speech keywords and places visual overlay clips directly onto the timeline.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl hover:border-yellow-500/50 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-400 text-black flex items-center justify-center font-bold shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
              <Type className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">70+ Google Font Scripts</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
              Full Google Font typography studio with support for English, Hindi (Devanagari), and Telugu scripts with un-clipped floating React portal popovers.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl hover:border-yellow-500/50 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-400 text-black flex items-center justify-center font-bold shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Ripple Sync & Nudges</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
              Fine-tune subtitle timing with 1-click nudge controls (`-0.5s`, `-0.1s`, `+0.1s`, `+0.5s`) and automatic downstream ripple timeline shifts.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl hover:border-yellow-500/50 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-400 text-black flex items-center justify-center font-bold shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">FFmpeg 60FPS Export</h3>
            <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
              Renders hardware-accelerated 60FPS MP4 videos with burned-in subtitles and fast-start metadata for seamless upload to Instagram, TikTok, and YouTube.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS PIPELINE */}
      <section className="py-20 bg-slate-100/60 dark:bg-zinc-900/60 border-y border-slate-200 dark:border-zinc-800 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <span className="text-xs font-black uppercase tracking-widest text-yellow-500 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              3-Step Creator Workflow
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white">
              How AutoCaptions AI Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-lg text-left space-y-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500 text-black font-black flex items-center justify-center text-lg">
                1
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Upload or Prompt</h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
                Drag & drop your raw video file (up to 1GB) or enter a topic prompt to generate a faceless short reel from scratch.
              </p>
            </div>

            <div className="relative p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-lg text-left space-y-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500 text-black font-black flex items-center justify-center text-lg">
                2
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">AI Directs & Syncs</h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
                Demucs isolates audio, Deepgram & Gemini 2.5 Flash generate kinetic timelines with active-word box highlights and B-Roll overlays.
              </p>
            </div>

            <div className="relative p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-lg text-left space-y-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500 text-black font-black flex items-center justify-center text-lg">
                3
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Export & Publish</h3>
              <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
                Preview live in 60FPS Canvas player, customize Google Fonts & hook banners, and export high-resolution H.264 MP4 videos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-24 px-4 max-w-5xl mx-auto text-center space-y-8">
        <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-tr from-slate-900 via-zinc-900 to-zinc-950 border border-zinc-800 text-white shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight relative z-10">
            Ready to Build Next-Level Viral Reels?
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-base relative z-10">
            Start creating broadcast-grade kinetic captions and AI-powered video shorts today.
          </p>

          <div className="pt-4 relative z-10">
            <button
              onClick={handleStartCreating}
              className="px-10 py-5 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black text-lg shadow-xl shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-3 cursor-pointer"
            >
              <Sparkles className="w-6 h-6 fill-black" />
              <span>Launch Studio Creator</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-zinc-800 py-12 px-4 text-center text-slate-500 dark:text-zinc-500 text-xs font-semibold">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-yellow-500 text-black font-black flex items-center justify-center text-xs">
              <Sparkles className="w-3.5 h-3.5 fill-black" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">AutoCaptions AI</span>
          </div>
          <p>© {new Date().getFullYear()} AutoCaptions AI SaaS Engine. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={handleStartCreating} className="hover:text-yellow-500 transition">Studio</button>
            <button onClick={() => openAuthModal('login')} className="hover:text-yellow-500 transition">Sign In</button>
            <button onClick={() => openAuthModal('register')} className="hover:text-yellow-500 transition">Get Started</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
