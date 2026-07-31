import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import VideoDropzone from '../components/upload/VideoDropzone';
import FacelessGeneratorModal from '../components/editor/FacelessGeneratorModal';
import ProjectCardItem from '../components/dashboard/ProjectCardItem';
import DashboardHeroSection from '../components/dashboard/DashboardHeroSection';
import DashboardModals from '../components/dashboard/DashboardModals';
import { listProjects, deleteProject, renameProject } from '../services/projectService';
import { Film, Clock, Sparkles, Volume2, CheckCircle2, ArrowRight, Trash2, Pencil, Check, X, Video, Wand2 } from 'lucide-react';
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
  const [showFacelessModal, setShowFacelessModal] = useState(false);

  // Multi-select state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

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
      setSelectedProjectIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      toast.success('Project deleted successfully!', { id: 'delete-toast' });
      setDeleteTarget(null);
    } catch (err) {
      toast.error(`Failed to delete project: ${err.message}`, { id: 'delete-toast' });
    } finally {
      setDeleting(false);
    }
  };

  // Checkbox Selection Handlers
  const toggleSelectProject = (e, id) => {
    e.stopPropagation();
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) {
        setIsSelectMode(false);
      }
      return next;
    });
  };

  const isAllSelected = projects.length > 0 && selectedProjectIds.size === projects.length;

  const handleSelectButtonClick = () => {
    if (!isSelectMode) {
      setIsSelectMode(true);
      setSelectedProjectIds(new Set()); // Start with 0 items checked
    } else {
      if (isAllSelected) {
        setSelectedProjectIds(new Set());
      } else {
        setSelectedProjectIds(new Set(projects.map((p) => p.id)));
      }
    }
  };

  const cancelSelectMode = () => {
    setIsSelectMode(false);
    setSelectedProjectIds(new Set());
  };

  const confirmBulkDelete = async () => {
    if (selectedProjectIds.size === 0) return;
    setBulkDeleting(true);
    const idsToDelete = Array.from(selectedProjectIds);
    toast.loading(`Deleting ${idsToDelete.length} selected projects...`, { id: 'bulk-delete-toast' });

    try {
      await Promise.all(idsToDelete.map((id) => deleteProject(id)));
      setProjects((prev) => prev.filter((p) => !selectedProjectIds.has(p.id)));
      setSelectedProjectIds(new Set());
      setIsSelectMode(false);
      toast.success(`Successfully deleted ${idsToDelete.length} projects!`, { id: 'bulk-delete-toast' });
      setShowBulkDeleteModal(false);
    } catch (err) {
      toast.error(`Failed to delete projects: ${err.message}`, { id: 'bulk-delete-toast' });
    } finally {
      setBulkDeleting(false);
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
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-8 sm:space-y-12 w-full max-w-full overflow-x-hidden">
      
      <DashboardHeroSection
          activeWordIndex={activeWordIndex}
          setShowFacelessModal={setShowFacelessModal}
          user={user}
          openAuthModal={openAuthModal}
          scrollToUpload={scrollToUpload}
        />

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-yellow-500" />
              Recent Projects
            </h3>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
              ({projects.length})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Select / Select All Toggle Button */}
            {projects.length > 0 && (
              <button
                type="button"
                onClick={handleSelectButtonClick}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition active:scale-95 cursor-pointer"
              >
                {isSelectMode && (
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    readOnly
                    className="w-4 h-4 rounded border-slate-300 dark:border-zinc-600 text-yellow-500 focus:ring-yellow-500/40 cursor-pointer"
                  />
                )}
                <span>
                  {!isSelectMode
                    ? 'Select'
                    : isAllSelected
                    ? 'Deselect All'
                    : 'Select All'}
                </span>
              </button>
            )}

            {/* Exit Select Mode Button */}
            {isSelectMode && (
              <button
                type="button"
                onClick={cancelSelectMode}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-zinc-800 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
            )}

            {/* Bulk Delete Action Button */}
            {isSelectMode && selectedProjectIds.size > 0 && (
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition active:scale-95 cursor-pointer animate-fadeIn"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ({selectedProjectIds.size}) Selected</span>
              </button>
            )}

            <button
              onClick={() => setShowFacelessModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-500/25 text-xs font-bold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>+ New AI Faceless Reel</span>
            </button>
          </div>
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
              <ProjectCardItem
                key={project.id}
                project={project}
                isSelected={selectedProjectIds.has(project.id)}
                isSelectMode={isSelectMode}
                onSelectProject={onSelectProject}
                onToggleSelect={toggleSelectProject}
                onOpenRename={openRenameModal}
                onOpenDelete={openDeleteModal}
              />
            ))}
          </div>
        )}
      </div>

      <DashboardModals
        showBulkDeleteModal={showBulkDeleteModal}
        setShowBulkDeleteModal={setShowBulkDeleteModal}
        selectedProjectIds={selectedProjectIds}
        bulkDeleting={bulkDeleting}
        confirmBulkDelete={confirmBulkDelete}
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        deleting={deleting}
        confirmDeleteProject={confirmDeleteProject}
        renameTarget={renameTarget}
        setRenameTarget={setRenameTarget}
        renameInput={renameInput}
        setRenameInput={setRenameInput}
        renaming={renaming}
        confirmRenameProject={confirmRenameProject}
        showFacelessModal={showFacelessModal}
        setShowFacelessModal={setShowFacelessModal}
        onSelectProject={onSelectProject}
      />

    </div>
  );
}

function StatusBadge({ status }) {
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isCancelled = status === 'cancelled';

  return (
    <span
      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
        isCompleted
          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
          : isFailed
          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
          : isCancelled
          ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse'
      }`}
    >
      {status}
    </span>
  );
}
