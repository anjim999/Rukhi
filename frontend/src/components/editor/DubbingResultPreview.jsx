import React from 'react';

export default function DubbingResultPreview({
  audioResultUrl,
  isPlaying,
  togglePlayPreview,
  handleApplyToTimeline,
}) {
  if (!audioResultUrl) return null;

  return (
    <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlayPreview}
          className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <div>
          <h4 className="text-xs font-semibold text-white">Audio Preview Generated</h4>
          <p className="text-[10px] text-indigo-300">Click to listen before adding to timeline</p>
        </div>
      </div>
      <button
        onClick={handleApplyToTimeline}
        className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
      >
        ✨ Apply to Timeline
      </button>
    </div>
  );
}
