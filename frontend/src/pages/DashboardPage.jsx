import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import VideoDropzone from '../components/upload/VideoDropzone';
import { listProjects, deleteProject, renameProject } from '../services/projectService';
import { Film, Clock, Sparkles, Volume2, CheckCircle2, ArrowRight, Trash2, Pencil, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TELUGU_CAPTION_WORDS = [
  { text: 'Mee', highlight: false },
  { text: 'video', highlight: false },
  { text: 'ki', highlight: false },
  { text: 'సరైన', highlight: true },
  { text: 'క్యాప్షన్స్', highlight: true },
];

export default function DashboardPage({ onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeWordIndex, setActiveWordIndex] = useState(3);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }
  const [deleting, setDeleting] = useState(false);

  const [renameTarget, setRenameTarget] = useState(null);
  const [renameInput, setRenameInput] = useState('');
  const [renaming, setRenaming] = useState(false);

  const openRenameModal = (e, project) => {
    e.stopPropagation();
    setRenameTarget(project);
    setRenameInput(project.title || '');
  };

  const confirmRenameProject = async () => {
    if (!renameTarget || !renameInput.trim()) return;
    setRenaming(true);
    toast.loading('Renaming project...', { id: 'rename-toast' });
    try {
      await renameProject(renameTarget.id, renameInput.trim());
      setProjects((prev) =>
        prev.map((p) => (p.id === renameTarget.id ? { ...p, title: renameInput.trim() } : p))
      );
      toast.success('Project renamed successfully!', { id: 'rename-toast' });
      setRenameTarget(null);
    } catch (err) {
      toast.error(`Rename failed: ${err.message}`, { id: 'rename-toast' });
    } finally {
      setRenaming(false);
    }
  };
  const { openAuthModal, user } = useAuth();

  const fetchProjects = async () => {
    try {
      const response = await listProjects();
      if (response && response.success) {
        setProjects(response.data?.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (e, project) => {
    e.stopPropagation(); // Stop opening project editor
    setDeleteTarget(project);
  };

  const confirmDeleteProject = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    toast.loading('Deleting project...', { id: 'delete-toast' });
    try {
      await deleteProject(deleteTarget.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success('Project deleted successfully!', { id: 'delete-toast' });
      setDeleteTarget(null);
    } catch (err) {
      toast.error(`Failed to delete project: ${err.message}`, { id: 'delete-toast' });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Word-by-word animation timer
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % TELUGU_CAPTION_WORDS.length);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const scrollToUpload = () => {
    const el = document.getElementById('upload-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      
      {/* Telugu Creators Hero Showcase */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-500/10 via-yellow-500/5 to-transparent border border-yellow-500/20 p-8 md:p-12 text-center space-y-6 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-xs font-extrabold shadow-sm">
          <Sparkles className="w-4 h-4 fill-yellow-500 text-yellow-500" />
          Built for Telugu creators
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            For Telugu creators
          </h1>
          <h2 className="text-xl sm:text-2xl font-extrabold text-yellow-600 dark:text-yellow-400">
            Word-by-word Telugu captions for Reels and Shorts.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            Telugu captions that don't look like a robot wrote them, burned into your export in under a minute.
          </p>
        </div>

        {/* Word-by-word Kinetic Caption Preview */}
        <div className="max-w-md mx-auto my-6 p-6 rounded-2xl bg-black/80 border border-zinc-800 shadow-2xl space-y-4 backdrop-blur">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-b border-zinc-800 pb-2">
            <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Audio Sync
            </span>
            <span>Tanglish & Telugu AI</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 py-4 min-h-[70px]">
            {TELUGU_CAPTION_WORDS.map((w, index) => {
              const isActive = index === activeWordIndex;
              return (
                <span
                  key={index}
                  className={`text-2xl sm:text-3xl font-black tracking-wide transition-all duration-300 ${
                    isActive
                      ? 'scale-110 text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]'
                      : w.highlight
                      ? 'text-yellow-500/90'
                      : 'text-zinc-400'
                  }`}
                >
                  {w.text}
                </span>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-zinc-400 pt-2 border-t border-zinc-800">
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
              Tanglish
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              Actual export · word-by-word
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
              Audio
            </span>
          </div>
        </div>

        {/* CTA Actions */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => {
              if (!user) {
                openAuthModal('register');
              } else {
                scrollToUpload();
              }
            }}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-extrabold text-sm shadow-xl shadow-yellow-500/30 hover:brightness-105 active:scale-95 transition"
          >
            Get started <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Creator Attribution Credit */}
        <div className="pt-4 text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-2">
          <span>Built for Telugu creators</span>
          <span>•</span>
          <span className="text-yellow-600 dark:text-yellow-400 font-bold">Built by @ssktechy</span>
        </div>
      </div>

      {/* Video Dropzone Section */}
      <div id="upload-section" className="space-y-4 pt-4">
        <VideoDropzone
          onProjectCreated={(project) => {
            onSelectProject(project.id);
          }}
        />
      </div>

      {/* Recent Projects Section */}
      <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Film className="w-4 h-4 text-yellow-500" />
            Recent Projects
          </h3>
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
            {projects.length} videos
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 rounded-xl bg-slate-200 dark:bg-zinc-900 animate-pulse border border-slate-200 dark:border-zinc-800" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 text-center text-slate-500 dark:text-zinc-400 text-xs shadow-sm">
            No projects yet. Drop a video clip above to generate your first AI caption reel!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="group p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-yellow-500/50 hover:shadow-lg dark:hover:bg-zinc-850 transition cursor-pointer space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-yellow-500 transition flex-1">
                    {project.title}
                  </h4>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusBadge status={project.status} />
                    <button
                      onClick={(e) => openRenameModal(e, project)}
                      title="Rename Project"
                      className="p-1 rounded-lg hover:bg-yellow-500/10 text-slate-400 hover:text-yellow-400 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => openDeleteModal(e, project)}
                      title="Delete Project"
                      className="p-1 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
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
            ))}
          </div>
        )}
      </div>

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
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-white font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition shadow-lg shadow-red-600/20 disabled:opacity-50"
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
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-white font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmRenameProject}
                disabled={renaming || !renameInput.trim()}
                className="flex-1 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs transition shadow-lg shadow-yellow-500/10 disabled:opacity-50"
              >
                {renaming ? 'Saving...' : 'Save Title'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function StatusBadge({ status }) {
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';

  return (
    <span
      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
        isCompleted
          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
          : isFailed
          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse'
      }`}
    >
      {status}
    </span>
  );
}
