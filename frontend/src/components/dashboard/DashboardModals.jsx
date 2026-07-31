import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import FacelessGeneratorModal from '../editor/FacelessGeneratorModal';

export default function DashboardModals({
  showBulkDeleteModal,
  setShowBulkDeleteModal,
  selectedProjectIds,
  bulkDeleting,
  confirmBulkDelete,
  deleteTarget,
  setDeleteTarget,
  deleting,
  confirmDeleteProject,
  renameTarget,
  setRenameTarget,
  renameInput,
  setRenameInput,
  renaming,
  confirmRenameProject,
  showFacelessModal,
  setShowFacelessModal,
  onSelectProject,
}) {
  return (
    <>
      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 dark:text-red-400">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Selected Projects?</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Are you sure you want to permanently delete <span className="text-slate-900 dark:text-white font-extrabold">{selectedProjectIds.size} selected projects</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={bulkDeleting}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-white font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                disabled={bulkDeleting}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition shadow-lg shadow-red-600/20 disabled:opacity-50 cursor-pointer"
              >
                {bulkDeleting ? 'Deleting...' : `Yes, Delete ${selectedProjectIds.size} Projects`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 dark:text-red-400">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Project?</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Are you sure you want to delete <span className="text-slate-900 dark:text-white font-semibold">"{deleteTarget.title}"</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-white font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition shadow-lg shadow-red-600/20 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Confirmation Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 dark:text-yellow-400">
              <Pencil className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Rename Video Project</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Enter a new name for your reel project.</p>
            </div>

            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRenameProject();
                if (e.key === 'Escape') setRenameTarget(null);
              }}
              autoFocus
              placeholder="Enter project name..."
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-yellow-500 dark:focus:border-yellow-400 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none"
            />

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setRenameTarget(null)}
                disabled={renaming}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-white font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmRenameProject}
                disabled={renaming || !renameInput.trim()}
                className="flex-1 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs transition shadow-lg shadow-yellow-500/10 disabled:opacity-50 cursor-pointer"
              >
                {renaming ? 'Saving...' : 'Save Title'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faceless AI Generator Modal */}
      <FacelessGeneratorModal
        isOpen={showFacelessModal}
        onClose={() => setShowFacelessModal(false)}
        onProjectCreated={(projectId) => {
          onSelectProject(projectId);
        }}
      />
    </>
  );
}
