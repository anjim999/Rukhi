import React from 'react';
import { Sparkles, Video, FolderOpen } from 'lucide-react';

export default function Header({ currentView, setView, activeProject }) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          onClick={() => setView('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-400 flex items-center justify-center text-black font-black shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 fill-black" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
              AutoCaptions
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                PRO V2
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeProject && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/50 text-xs text-zinc-300">
              <Video className="w-3.5 h-3.5 text-yellow-400" />
              <span className="max-w-[180px] truncate font-medium">{activeProject.title}</span>
            </div>
          )}

          <button
            onClick={() => setView('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'dashboard'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Projects
          </button>
        </div>
      </div>
    </header>
  );
}
