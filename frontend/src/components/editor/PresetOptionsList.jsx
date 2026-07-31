import React from 'react';

export default function PresetOptionsList({
  presetOptions,
  currentPreset,
  applyPreset,
}) {
  return (
    <div className="grid grid-cols-1 gap-2.5 animate-fadeIn">
      {presetOptions.map((preset) => {
        const isActive = currentPreset === preset.id;
        return (
          <div
            key={preset.id}
            onClick={() => applyPreset(preset)}
            className={`p-3.5 min-h-[52px] rounded-2xl border transition-all cursor-pointer active:scale-[0.98] ${
              isActive
                ? 'border-yellow-500 dark:border-yellow-400 bg-yellow-500/10 dark:bg-yellow-400/10 shadow-lg shadow-yellow-500/10 ring-1 ring-yellow-500/30'
                : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100/40 dark:hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                {preset.name}
              </span>
              <span
                className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-yellow-500 dark:bg-yellow-400 text-black shadow-xs'
                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                }`}
              >
                {preset.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
              {preset.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
