import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getProject,
  getProjectTimeline,
  updateProjectTimeline,
  generateSocialPack,
  cancelProject,
  pauseProject,
  resumeProject,
  renameProject,
} from '../services/projectService';
import CanvasVideoPlayer from '../components/editor/CanvasVideoPlayer';
import PresetSidebar from '../components/editor/PresetSidebar';
import TimelineEditor from '../components/editor/TimelineEditor';
import { Loader2, Save, ArrowLeft, AlertTriangle, Check, Share2, Copy, Sparkles, X, Pause, Play, XCircle, Pencil, Undo2, Redo2 } from 'lucide-react';

const TARGET_STYLE_MAP = {
  english: '🇬🇧 Pure English',
  telugu: '🇮🇳 Pure Telugu',
  hindi: '🇮🇳 Pure Hindi',
  tel_eng: '⚡ Tanglish',
  chatting: '💬 Spoken Chat',
  genz: '🔥 Gen-Z Viral',
  dramatic: '🎬 Dramatic Cinema',
  punchy: '⚡ Short & Punchy',
  auto: '🌐 As Spoken',
};

export default function EditorPage({ projectId, onBack }) {
  const [project, setProject] = useState(null);
  const [timeline, setTimelineState] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [initialFetch, setInitialFetch] = useState(true);
  const [mobileTab, setMobileTab] = useState('player'); // 'player' | 'editor' | 'presets'
  const [aspectRatio, setAspectRatio] = useState('9:16');

  // Undo / Redo History Stack State
  const historyRef = React.useRef([]);
  const historyIndexRef = React.useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const setTimeline = React.useCallback((nextVal) => {
    setTimelineState((prevTimeline) => {
      const resolved = typeof nextVal === 'function' ? nextVal(prevTimeline) : nextVal;
      if (!resolved) return resolved;

      // Push snapshot to history stack
      const snapshot = JSON.parse(JSON.stringify(resolved));
      const currIdx = historyIndexRef.current;

      // Only push if snapshot is genuinely different
      const currentHistorySnap = historyRef.current[currIdx];
      if (currentHistorySnap && JSON.stringify(currentHistorySnap) === JSON.stringify(snapshot)) {
        return resolved;
      }

      const history = historyRef.current.slice(0, currIdx + 1);
      history.push(snapshot);
      if (history.length > 50) history.shift();

      historyRef.current = history;
      historyIndexRef.current = history.length - 1;
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(false);

      return resolved;
    });
  }, []);

  const handleUndo = React.useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prevSnapshot = historyRef.current[historyIndexRef.current];
      setTimelineState(JSON.parse(JSON.stringify(prevSnapshot)));
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      toast.success('Undo timeline edit', { id: 'undo-redo-toast', duration: 1500 });
    }
  }, []);

  const handleRedo = React.useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const nextSnapshot = historyRef.current[historyIndexRef.current];
      setTimelineState(JSON.parse(JSON.stringify(nextSnapshot)));
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      toast.success('Redo timeline edit', { id: 'undo-redo-toast', duration: 1500 });
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Title edit state
  const titleInputRef = React.useRef(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [renamingTitle, setRenamingTitle] = useState(false);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      const val = titleInputRef.current.value || '';
      const lastDotIndex = val.lastIndexOf('.');
      const targetPos = lastDotIndex > 0 ? lastDotIndex : val.length;

      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
          titleInputRef.current.setSelectionRange(targetPos, targetPos);
        }
      }, 50);
    }
  }, [isEditingTitle]);

  // Social Post Generator Modal state
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialData, setSocialData] = useState(null);
  const [copiedIg, setCopiedIg] = useState(false);
  const [copiedYt, setCopiedYt] = useState(false);

  const handleSaveTitle = async () => {
    if (!titleInput.trim() || titleInput.trim() === project?.title) {
      setIsEditingTitle(false);
      return;
    }
    setRenamingTitle(true);
    try {
      const res = await renameProject(projectId, titleInput.trim());
      if (res.success) {
        setProject((prev) => (prev ? { ...prev, title: titleInput.trim() } : prev));
        toast.success('Project title updated!');
      }
    } catch (err) {
      toast.error(`Rename failed: ${err.message}`);
    } finally {
      setRenamingTitle(false);
      setIsEditingTitle(false);
    }
  };

  useEffect(() => {
    let intervalId;

    const fetchProjectAndTimeline = async () => {
      try {
        const projRes = await getProject(projectId);
        if (projRes.success) {
          setProject(projRes.data);
          setInitialFetch(false);

          if (projRes.data.status === 'completed') {
            const timeRes = await getProjectTimeline(projectId);
            if (timeRes.success) {
              setTimeline(timeRes.data);
              setLoading(false);
              if (intervalId) clearInterval(intervalId);
            }
          } else if (projRes.data.status === 'failed' || projRes.data.status === 'cancelled') {
            setError(projRes.data.error_message || 'Media processing failed or was cancelled.');
            setLoading(false);
            if (intervalId) clearInterval(intervalId);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load project details.');
        setLoading(false);
        if (intervalId) clearInterval(intervalId);
      }
    };

    fetchProjectAndTimeline();
    intervalId = setInterval(fetchProjectAndTimeline, 3000);

    return () => clearInterval(intervalId);
  }, [projectId]);

  const handleCancelGeneration = async () => {
    setCancelling(true);
    toast.loading('Cancelling caption generation...', { id: 'cancel-toast' });
    try {
      await cancelProject(projectId);
      toast.success('Generation cancelled.', { id: 'cancel-toast' });
      setError('Generation cancelled by user.');
      setLoading(false);
    } catch (err) {
      toast.error(`Cancel failed: ${err.message}`, { id: 'cancel-toast' });
    } finally {
      setCancelling(false);
    }
  };

  const handlePauseResumeToggle = async () => {
    if (!project) return;
    setPausing(true);
    const isPaused = project.status === 'paused';
    const actionText = isPaused ? 'Resuming' : 'Pausing';
    toast.loading(`${actionText} generation...`, { id: 'pause-toast' });
    try {
      if (isPaused) {
        await resumeProject(projectId);
        setProject((p) => (p ? { ...p, status: 'transcribing' } : p));
        toast.success('Generation resumed!', { id: 'pause-toast' });
      } else {
        await pauseProject(projectId);
        setProject((p) => (p ? { ...p, status: 'paused' } : p));
        toast.success('Generation paused.', { id: 'pause-toast' });
      }
    } catch (err) {
      toast.error(`Action failed: ${err.message}`, { id: 'pause-toast' });
    } finally {
      setPausing(false);
    }
  };

  const handleSaveTimeline = async () => {
    if (!timeline) return;
    setSaving(true);
    setSaveSuccess(false);
    toast.loading('Saving timeline...', { id: 'save-toast' });
    try {
      await updateProjectTimeline(projectId, timeline);
      setSaveSuccess(true);
      toast.success('Timeline changes saved!', { id: 'save-toast' });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      toast.error(`Save failed: ${err.message}`, { id: 'save-toast' });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSocialModal = async () => {
    setShowSocialModal(true);
    if (!socialData && !socialLoading) {
      setSocialLoading(true);
      toast.loading('Generating AI Social Post Pack...', { id: 'social-toast' });
      try {
        const res = await generateSocialPack(projectId);
        if (res.success) {
          setSocialData(res.data);
          toast.success('Generated AI Social Post Pack!', { id: 'social-toast' });
        }
      } catch (err) {
        toast.error(`Failed to generate social pack: ${err.message}`, { id: 'social-toast' });
      } finally {
        setSocialLoading(false);
      }
    }
  };

  const handleCopyIg = () => {
    if (!socialData?.instagram) return;
    const text = `${socialData.instagram.caption}\n\n${socialData.instagram.hashtags.join(' ')}`;
    navigator.clipboard.writeText(text);
    setCopiedIg(true);
    toast.success('Instagram Reel post copied to clipboard!', { id: 'copy-toast' });
    setTimeout(() => setCopiedIg(false), 2000);
  };

  const handleCopyYt = () => {
    if (!socialData?.youtubeShorts) return;
    const text = `${socialData.youtubeShorts.title}\n\n${socialData.youtubeShorts.description}\n\n${socialData.youtubeShorts.hashtags.join(' ')}`;
    navigator.clipboard.writeText(text);
    setCopiedYt(true);
    setTimeout(() => setCopiedYt(false), 2500);
  };

  if (loading) {
    // Show a neutral loader during initial fetch to avoid flickering
    // the "Generating" screen for already-cancelled/failed/completed projects
    if (initialFetch) {
      return (
        <div className="min-h-[75vh] flex flex-col items-center justify-center gap-4 text-center px-4">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
          <p className="text-sm text-zinc-400 font-medium">Loading project...</p>
        </div>
      );
    }

    const isPaused = project?.status === 'paused';
    const targetStyleMap = {
      english: { label: '🇬🇧 Pure English', desc: 'Auto-Translated' },
      telugu: { label: '🇮🇳 Pure Telugu', desc: 'తెలుగు Native Script' },
      hindi: { label: '🇮🇳 Pure Hindi', desc: 'हिंदी Native Script' },
      tel_eng: { label: '⚡ Tel + Eng', desc: 'Bilingual Tanglish' },
      chatting: { label: '💬 Chat Script', desc: 'em chestunnav raa' },
      auto: { label: '🌐 As Spoken', desc: 'Auto Script' },
    };
    const activeStyle = targetStyleMap[timeline?.targetStyle || project?.targetStyle || project?.target_style] || targetStyleMap['auto'];

    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className={`w-16 h-16 rounded-2xl ${isPaused ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'} border flex items-center justify-center`}>
          {isPaused ? <Pause className="w-8 h-8" /> : <Loader2 className="w-8 h-8 animate-spin" />}
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

        {/* Cancel, Pause & Resume Buttons */}
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

  const handleRestartGeneration = async () => {
    setError(null);
    setLoading(true);
    toast.loading('Restarting AI caption generation...', { id: 'restart-toast' });
    try {
      await resumeProject(projectId);
      toast.success('Generation restarted freshly!', { id: 'restart-toast' });
    } catch (err) {
      toast.error(`Failed to restart: ${err.message}`, { id: 'restart-toast' });
      setError(err.message);
      setLoading(false);
    }
  };

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

  const rawApiUrl = import.meta.env.VITE_API_BASE_URL || '';
  const backendHost = rawApiUrl
    ? rawApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '')
    : 'http://localhost:5000';

  const rawVideoPath = project?.video_url || project?.video_path || '';
  let videoFullUrl = '';
  if (rawVideoPath) {
    if (rawVideoPath.startsWith('http://') || rawVideoPath.startsWith('https://')) {
      videoFullUrl = rawVideoPath;
    } else {
      let normalized = rawVideoPath.replace(/\\/g, '/');
      const uploadsIdx = normalized.indexOf('uploads/');
      if (uploadsIdx !== -1) {
        normalized = normalized.substring(uploadsIdx);
      }
      normalized = normalized.replace(/^\/+/, '');
      videoFullUrl = `${backendHost}/${normalized}`;
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 sm:pb-12 w-full max-w-full overflow-x-hidden">
      {/* Editor Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 bg-white/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800/80 p-3 sm:p-4 rounded-2xl backdrop-blur-md transition-colors shadow-sm w-full max-w-full overflow-x-hidden">
        {/* Left: Back & Project Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 mb-0.5">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  className="bg-slate-50 dark:bg-zinc-950 border border-yellow-500/50 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
                <button
                  onClick={handleSaveTitle}
                  disabled={renamingTitle}
                  className="p-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black transition shrink-0"
                  title="Save title"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition shrink-0"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 mb-0.5 group cursor-pointer"
                onClick={() => {
                  setTitleInput(project?.title || '');
                  setIsEditingTitle(true);
                }}
                title="Click to edit project title"
              >
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight group-hover:text-yellow-500 dark:group-hover:text-yellow-400 transition truncate max-w-[180px] sm:max-w-[260px]">
                  {project?.title || 'Untitled Video Project'}
                </h1>
                <button className="text-slate-400 dark:text-zinc-500 group-hover:text-yellow-500 dark:group-hover:text-yellow-400 opacity-70 group-hover:opacity-100 transition shrink-0">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 truncate">
              Kinetic Subtitle Studio • {timeline?.segments?.length || 0} Timeblocks
            </p>
          </div>
        </div>

        {/* Center: Aspect Ratio & Active Script Mode Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-center my-1 sm:my-0">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200 dark:border-zinc-700/80">
            <button
              onClick={() => setAspectRatio('9:16')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${
                aspectRatio === '9:16'
                  ? 'bg-yellow-500 dark:bg-yellow-400 text-black shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📱 9:16 Reel
            </button>
            <button
              onClick={() => setAspectRatio('16:9')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${
                aspectRatio === '16:9'
                  ? 'bg-yellow-500 dark:bg-yellow-400 text-black shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🎬 16:9 Wide
            </button>
            <button
              onClick={() => setAspectRatio('1:1')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${
                aspectRatio === '1:1'
                  ? 'bg-yellow-500 dark:bg-yellow-400 text-black shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ⏹️ 1:1 Square
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 font-bold text-xs">
            <span className="opacity-75">Script Mode:</span>
            <span>{TARGET_STYLE_MAP[timeline?.targetStyle] || TARGET_STYLE_MAP['auto']}</span>
          </div>
        </div>

        {/* Right: Undo/Redo, AI Pack, Save */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          {/* Undo / Redo Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200 dark:border-zinc-700/80">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-1.5 rounded-lg text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-zinc-700 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Undo timeline edit (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-1.5 rounded-lg text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-zinc-700 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Redo timeline edit (Ctrl+Y or Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* AI Post Generator Button */}
          <button
            onClick={handleOpenSocialModal}
            className="px-3 sm:px-4 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-500 hover:to-rose-400 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-purple-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" />
            <span>AI Pack</span>
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

      {/* 3-Column Studio Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start w-full max-w-full overflow-x-hidden">
        {/* Left Column: Preset & Style Sidebar */}
        <div className={`lg:col-span-4 ${mobileTab === 'presets' ? 'block' : 'hidden lg:block'}`}>
          <PresetSidebar timeline={timeline} setTimeline={setTimeline} />
        </div>

        {/* Middle Column: 60fps Canvas Video Player */}
        <div className={`lg:col-span-4 flex justify-center ${mobileTab === 'player' ? 'block' : 'hidden lg:block'}`}>
          <CanvasVideoPlayer
            projectId={projectId}
            videoUrl={videoFullUrl}
            timeline={timeline}
            setTimeline={setTimeline}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            projectTitle={project?.title}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
          />
        </div>

        {/* Right Column: Time-Frame Granular Editor */}
        <div className={`lg:col-span-4 ${mobileTab === 'editor' ? 'block' : 'hidden lg:block'}`}>
          <TimelineEditor
            projectId={projectId}
            timeline={timeline}
            setTimeline={setTimeline}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>
      </div>

      {/* Sticky Bottom Mobile Quick Dock (Visible on Mobile & Tablets < 1024px) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 p-2 z-40 flex items-center justify-around shadow-2xl">
        <button
          type="button"
          onClick={() => {
            setMobileTab('player');
            if (navigator.vibrate) navigator.vibrate(15);
          }}
          className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition text-xs font-bold cursor-pointer ${
            mobileTab === 'player'
              ? 'text-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/20 shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Player</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobileTab('editor');
            if (navigator.vibrate) navigator.vibrate(15);
          }}
          className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition text-xs font-bold cursor-pointer ${
            mobileTab === 'editor'
              ? 'text-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/20 shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Pencil className="w-4 h-4" />
          <span>Timeline</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobileTab('presets');
            if (navigator.vibrate) navigator.vibrate(15);
          }}
          className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition text-xs font-bold cursor-pointer ${
            mobileTab === 'presets'
              ? 'text-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/20 shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Styles</span>
        </button>

        <button
          type="button"
          onClick={() => {
            handleSaveTimeline();
            if (navigator.vibrate) navigator.vibrate(25);
          }}
          disabled={saving}
          className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-bold bg-yellow-500 text-black shadow-md active:scale-95 transition cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Save className="w-4 h-4 text-black" />}
          <span>{saving ? 'Saving' : 'Save'}</span>
        </button>
      </div>

      {/* AI Instagram & YouTube Post Generator Modal */}
      {showSocialModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar relative shadow-2xl">
            <button
              onClick={() => setShowSocialModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Post-Ready Content Pack</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Zero-hallucination captions, titles, and viral #hashtags generated directly from your video transcript.
            </p>

            {socialLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500 dark:text-yellow-400" />
                <p className="text-xs text-slate-700 dark:text-zinc-300 font-semibold">Analyzing transcript & generating viral #hashtags...</p>
              </div>
            ) : socialData ? (
              <div className="space-y-5">
                {/* Instagram Reels Pack */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pink-500 dark:text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                      📸 Instagram Reels Pack
                    </span>
                    <button
                      onClick={handleCopyIg}
                      className="px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-600 dark:text-pink-300 hover:bg-pink-500/20 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      {copiedIg ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIg ? 'Copied!' : 'Copy IG Pack'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {socialData.instagram?.caption}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {socialData.instagram?.hashtags?.map((tag) => (
                      <span key={tag} className="text-[11px] font-mono text-pink-600 dark:text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* YouTube Shorts Pack */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      🎬 YouTube Shorts Pack
                    </span>
                    <button
                      onClick={handleCopyYt}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 hover:bg-red-500/20 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      {copiedYt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedYt ? 'Copied!' : 'Copy YT Pack'}</span>
                    </button>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase block mb-1">Viral Title</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{socialData.youtubeShorts?.title}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase block mb-1">Description</span>
                    <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{socialData.youtubeShorts?.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {socialData.youtubeShorts?.hashtags?.map((tag) => (
                      <span key={tag} className="text-[11px] font-mono text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
