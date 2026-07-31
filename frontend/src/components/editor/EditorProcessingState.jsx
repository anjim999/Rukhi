import React from 'react';
import { Loader2, Play, Pause, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function EditorProcessingState({
  loading,
  initialFetch,
  project,
  pausing,
  cancelling,
  error,
  activeStyle,
  handlePauseResumeToggle,
  handleCancelGeneration,
  handleRestartGeneration,
  onBack,
}) {
  if (loading) {
    if (initialFetch) {
      return (
        <div className="min-h-[75vh] flex flex-col items-center justify-center gap-4 text-center px-4">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
          <p className="text-sm font-medium text-zinc-400">Loading project details...</p>
        </div>
      );
    }

    const isPaused = project?.status === 'paused';
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
            {isPaused ? <Pause className="w-10 h-10" /> : <Loader2 className="w-10 h-10 animate-spin" />}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            {isPaused ? 'Generation Paused' : `Generating AI Captions (${activeStyle.label})...`}
          </h2>
          <p className="text-sm text-zinc-400 max-w-md">
            {isPaused
              ? 'Processing is paused. Click Resume to continue generating subtitles.'
              : `Transcribing speech audio and generating kinetic reel subtitles in ${activeStyle.label} style.`}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-yellow-400/80 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
          <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-yellow-400 animate-pulse'}`} />
          <span>Status: {project?.status || 'transcribing'}</span>
          <span className="opacity-40">•</span>
          <span className="font-bold text-yellow-400">{activeStyle.label}</span>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handlePauseResumeToggle}
            disabled={pausing}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition flex items-center gap-2 border border-zinc-700 disabled:opacity-50"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 text-emerald-400" /> Resume Generation
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 text-amber-400" /> Pause Generation
              </>
            )}
          </button>

          <button
            onClick={handleCancelGeneration}
            disabled={cancelling}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition flex items-center gap-2 border border-red-500/20 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" /> Cancel Generation
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    const isCancelled = project?.status === 'cancelled' || error.toLowerCase().includes('cancelled');
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4 max-w-md mx-auto">
        <div className={`w-16 h-16 rounded-2xl ${isCancelled ? 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} border flex items-center justify-center`}>
          {isCancelled ? <XCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-2">{isCancelled ? 'Generation Cancelled' : 'Processing Error'}</h3>
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 leading-relaxed text-left break-words">
            {error}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </button>
          <button
            onClick={handleRestartGeneration}
            className="px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-yellow-500/20"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>Regenerate Fresh</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
