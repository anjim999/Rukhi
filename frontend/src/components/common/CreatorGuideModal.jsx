import React from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, X, Sparkles, Wand2, Video, Languages, ShieldCheck, Zap, Layers, Play } from 'lucide-react';

export default function CreatorGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-white max-h-[90vh] flex flex-col">
        
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 dark:text-yellow-400 shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                rukhi.in Creator Master Guide
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30">
                  PRO v2.5
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Everything you need to create viral 60FPS reels in seconds</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Scroll Area */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
          
          {/* Section 1: Kinetic Subtitles & Sync Engine */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-bold text-sm">
              <Zap className="w-4 h-4" />
              <span>1. 100% Verbatim & Monotonic Sync Engine</span>
            </div>
            <p>
              rukhi.in uses a custom microsecond timestamp repair engine. Spoken words are matched 1:1 with audio onset with zero drift, artificial gaps, or truncated words.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 shadow-sm">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">⚡ Preset Themes</span>
                <p className="text-slate-500 dark:text-zinc-400">Choose from Hormozi, Submagic Glow, MrBeast, and Gold Luxury visual boxes.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 shadow-sm">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">⏱️ Ripple Sync & Nudge</span>
                <p className="text-slate-500 dark:text-zinc-400">Nudge timeline -0.5s or +0.5s with 1-click auto-shifting downstream text.</p>
              </div>
            </div>
          </div>

          {/* Section 2: Regional Script Modes & Telglish */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-sm">
              <Languages className="w-4 h-4" />
              <span>2. Regional Script Modes & Telglish / Hinglish</span>
            </div>
            <p>
              Select your script mode before uploading:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-zinc-400">
              <li><strong className="text-slate-900 dark:text-white">Pure English / Pure Telugu / Pure Hindi:</strong> Transcribes directly in native script.</li>
              <li><strong className="text-slate-900 dark:text-white">Tanglish / Telglish (Chat Style):</strong> Deterministically transliterates Telugu speech into Romanized chat script (e.g. <em>"tammudu okka nimisham..."</em>).</li>
              <li><strong className="text-slate-900 dark:text-white">1-Click Subtitle Translator:</strong> Translate subtitles inside the editor into any target language in 2 seconds while preserving word timestamps.</li>
            </ul>
          </div>

          {/* Section 3: AI B-Roll & Faceless Reel Generator */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
              <Wand2 className="w-4 h-4" />
              <span>3. AI B-Roll Overlays & Faceless Prompt-to-Reel</span>
            </div>
            <p>
              Automate visual story B-roll overlays:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-zinc-400">
              <li><strong className="text-slate-900 dark:text-white">AI B-Roll Button:</strong> Automatically extracts keyword triggers from speech and inserts AI visual scene clips on the timeline.</li>
              <li><strong className="text-slate-900 dark:text-white">Faceless Reel Generator:</strong> Type any prompt topic (e.g. <em>"5 habits of successful founders"</em>) to generate full script, neural voice, background visuals, and subtitles automatically.</li>
            </ul>
          </div>

          {/* Section 4: 1-Click Viral Post Pack & Export */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 font-bold text-sm">
              <Video className="w-4 h-4" />
              <span>4. 60FPS Hardware Render & Viral Social Pack</span>
            </div>
            <p>
              Export broadcast 60FPS MP4 videos with burned-in subtitles in 2-4 seconds. Click <strong className="text-slate-900 dark:text-white">🚀 Viral Post Pack</strong> in the editor to copy Instagram Reel captions, YouTube Shorts titles, and 15 high-reach hashtags in 1 click!
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-zinc-400">Need personal help? Contact support@rukhi.in</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs transition shadow-lg shadow-yellow-500/20 cursor-pointer"
          >
            Got it, Let's Create!
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
