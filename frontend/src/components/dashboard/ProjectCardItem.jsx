import React from 'react';
import { Clock, Pencil, Trash2, CheckCircle2, Wand2 } from 'lucide-react';

function StatusBadge({ status }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-extrabold uppercase">
        <CheckCircle2 className="w-3 h-3" /> Ready
      </span>
    );
  }
  if (status === 'processing') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-extrabold uppercase">
        <Wand2 className="w-3 h-3 animate-spin" /> Processing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 text-[10px] font-extrabold uppercase">
      Draft
    </span>
  );
}

export default function ProjectCardItem({
  project,
  isSelected,
  isSelectMode,
  onSelectProject,
  onToggleSelect,
  onOpenRename,
  onOpenDelete,
}) {
  return (
    <div
      onClick={() => onSelectProject(project.id)}
      className={`group p-4 rounded-2xl bg-white dark:bg-zinc-900 border transition-all cursor-pointer space-y-3 relative overflow-hidden active:scale-[0.99] ${
        isSelected
          ? 'border-yellow-500 dark:border-yellow-400 bg-yellow-500/5 dark:bg-yellow-400/5 shadow-lg shadow-yellow-500/10 ring-2 ring-yellow-500/30'
          : 'border-slate-200 dark:border-zinc-800 hover:border-yellow-500/50 hover:shadow-lg dark:hover:bg-zinc-850'
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        {/* Checkbox for Multi-select */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {isSelectMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onToggleSelect(e, project.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-4.5 h-4.5 rounded-md border-slate-300 dark:border-zinc-600 text-yellow-500 focus:ring-yellow-500/40 cursor-pointer shrink-0 mt-0.5"
            />
          )}
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate group-hover:text-yellow-500 transition flex-1">
            {project.title}
          </h4>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge status={project.status} />
          <button
            onClick={(e) => onOpenRename(e, project)}
            title="Rename Project"
            className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-slate-400 hover:text-yellow-400 transition cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => onOpenDelete(e, project)}
            title="Delete Single Project"
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-mono pt-2 border-t border-slate-100 dark:border-zinc-800/60">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
          {project.duration ? `${Math.round(project.duration)}s` : '--'}
        </span>
        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
          {new Date(project.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
