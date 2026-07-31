import React from 'react';
import { Play, Pencil, Sparkles, Save, Loader2 } from 'lucide-react';

export default function EditorMobileDock({
  mobileTab,
  setMobileTab,
  handleSaveTimeline,
  saving,
}) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 p-2 z-40 flex items-center justify-around shadow-2xl">
      <button
        type="button"
        onClick={() => {
          setMobileTab('player');
          if (navigator.vibrate) navigator.vibrate(15);
        }}
        className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition text-xs font-bold cursor-pointer ${
          mobileTab === 'player'
            ? 'text-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/20 shadow-sm'
            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Play className="w-4 h-4 fill-current" />
        <span>Player</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setMobileTab('editor');
          if (navigator.vibrate) navigator.vibrate(15);
        }}
        className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition text-xs font-bold cursor-pointer ${
          mobileTab === 'editor'
            ? 'text-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/20 shadow-sm'
            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Pencil className="w-4 h-4" />
        <span>Timeline</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setMobileTab('presets');
          if (navigator.vibrate) navigator.vibrate(15);
        }}
        className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition text-xs font-bold cursor-pointer ${
          mobileTab === 'presets'
            ? 'text-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/20 shadow-sm'
            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span>Styles</span>
      </button>

      <button
        type="button"
        onClick={() => {
          handleSaveTimeline();
          if (navigator.vibrate) navigator.vibrate(25);
        }}
        disabled={saving}
        className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-bold bg-yellow-500 text-black shadow-md active:scale-95 transition cursor-pointer"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Save className="w-4 h-4 text-black" />}
        <span>{saving ? 'Saving' : 'Save'}</span>
      </button>
    </div>
  );
}
