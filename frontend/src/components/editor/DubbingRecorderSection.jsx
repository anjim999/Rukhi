import React from 'react';

export default function DubbingRecorderSection({
  isRecording,
  isPaused,
  isTranscribing,
  startMicRecording,
  pauseMicRecording,
  resumeMicRecording,
  stopAndTranscribeMicRecording,
  recordingSeconds,
  formatTimer,
  scriptText,
  setScriptText,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          3. Voice Script Input (Speak or Type)
        </label>
        <span className="text-[10px] text-indigo-400 font-semibold">✨ Gemini 2.5 Flash Autocorrect Active</span>
      </div>

      {/* Mic Voice Input Recording Bar */}
      <div className="mb-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <button
              onClick={startMicRecording}
              disabled={isTranscribing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-red-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span>🎙️</span> Speak Script (Mic)
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {!isPaused ? (
                <button
                  onClick={pauseMicRecording}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>⏸️</span> Pause Take
                </button>
              ) : (
                <button
                  onClick={resumeMicRecording}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>▶️</span> Resume Take
                </button>
              )}

              <button
                onClick={stopAndTranscribeMicRecording}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>✨</span> Done & Transcribe
              </button>
            </div>
          )}

          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800">
              <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-xs font-mono font-bold text-white">{formatTimer(recordingSeconds)}</span>
              <span className="text-[10px] text-slate-400">{isPaused ? '(Paused)' : '(Recording)'}</span>
            </div>
          )}

          {isTranscribing && (
            <div className="flex items-center gap-2 text-xs text-indigo-300">
              <span className="animate-spin">⏳</span> AI Autocorrecting Speech...
            </div>
          )}
        </div>

        <span className="text-[10px] text-slate-400">
          Multi-take pauses supported • Auto-fixes spelling & grammar
        </span>
      </div>

      {/* Editable Text Area */}
      <textarea
        rows={3}
        value={scriptText}
        onChange={(e) => setScriptText(e.target.value)}
        placeholder="Speak via Mic above or type script manually in any language..."
        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
      />
    </div>
  );
}
