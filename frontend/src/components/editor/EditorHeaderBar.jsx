import React from 'react';
import { ArrowLeft, Pencil, Check, X, Undo2, Redo2, Loader2, Video, Wand2, Share2, Save } from 'lucide-react';

export default function EditorHeaderBar({
  project,
  isEditingTitle,
  titleInput,
  setTitleInput,
  handleStartRename,
  handleCancelRename,
  handleSaveTitle,
  savingTitle,
  navigate,
  handleUndo,
  handleRedo,
  canUndo,
  canRedo,
  handleAutoInsertBRoll,
  brollLoading,
  setShowFacelessModal,
  setShowDubbingModal,
  handleOpenSocialModal,
  handleSaveTimeline,
  saving,
  saveSuccess,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200 dark:border-zinc-800 shadow-lg">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {isEditingTitle ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="bg-slate-100 dark:bg-zinc-950 border border-yellow-500 text-slate-900 dark:text-white font-extrabold text-sm px-3 py-1 rounded-xl focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleSaveTitle}
              disabled={savingTitle}
              className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCancelRename}
              className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group min-w-0">
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
              {project?.title || 'Untitled Video Reel'}
            </h1>
            <button
              onClick={handleStartRename}
              className="p-1 rounded-lg text-slate-400 hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Undo / Redo Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200 dark:border-zinc-700/60">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-zinc-700 transition min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            title="Undo timeline edit (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-zinc-700 transition min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            title="Redo timeline edit (Ctrl+Y or Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* AI B-Roll Auto-Inserter Button */}
        <button
          onClick={handleAutoInsertBRoll}
          disabled={brollLoading}
          className="px-3 sm:px-4 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 whitespace-nowrap active:scale-95 cursor-pointer disabled:opacity-50"
          title="Auto-detect visual keywords & insert AI video clips ($0 API)"
        >
          {brollLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : (
            <Video className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
          )}
          <span>AI B-Roll</span>
        </button>

        {/* Prompt-to-Video Faceless Reel Button */}
        <button
          onClick={() => setShowFacelessModal(true)}
          className="px-3 sm:px-4 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
          title="Generate Faceless Reel (Script + Voice + Background + Subtitles) from Text Prompt"
        >
          <Wand2 className="w-3.5 h-3.5 shrink-0 text-black" />
          <span>Faceless Reel</span>
        </button>

        {/* Dubbing & Voice Studio Button */}
        <button
          onClick={() => setShowDubbingModal(true)}
          className="px-3 sm:px-4 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-400 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
          title="Open AI Voice Studio & Dubbing"
        >
          <span className="text-sm">🎙️</span>
          <span>Dubbing Studio</span>
        </button>

        {/* AI Post Generator Button */}
        <button
          onClick={handleOpenSocialModal}
          className="px-3 sm:px-4 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-500 hover:to-rose-400 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-purple-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
          title="Generate 1-Click Viral Instagram Caption, Title & Hashtags"
        >
          <Share2 className="w-3.5 h-3.5 shrink-0" />
          <span>🚀 Viral Post Pack</span>
        </button>

        {/* Save Timeline Button */}
        <button
          onClick={handleSaveTimeline}
          disabled={saving}
          className={`px-3.5 sm:px-4 py-2 min-h-[38px] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm active:scale-95 ${
            saveSuccess
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-yellow-500/20'
          }`}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-black shrink-0" />
          ) : saveSuccess ? (
            <Check className="w-3.5 h-3.5 text-white shrink-0" />
          ) : (
            <Save className="w-3.5 h-3.5 text-black shrink-0" />
          )}
          <span>{saving ? 'Saving' : saveSuccess ? 'Saved!' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
}
