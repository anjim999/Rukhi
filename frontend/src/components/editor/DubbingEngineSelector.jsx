import React from 'react';

export default function DubbingEngineSelector({
  engines,
  selectedEngine,
  setSelectedEngine,
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
        2. Select Voice Engine
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {engines.map((engine) => (
          <div
            key={engine.id}
            onClick={() => setSelectedEngine(engine.id)}
            className={`cursor-pointer p-4 rounded-2xl border transition-all relative overflow-hidden ${
              selectedEngine === engine.id
                ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                {engine.name}
              </h3>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                {engine.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">{engine.description}</p>
            <div className="flex flex-wrap gap-1">
              {engine.features?.map((feat, idx) => (
                <span key={idx} className="text-[9px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800">
                  {feat}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
