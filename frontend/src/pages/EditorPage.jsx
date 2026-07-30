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
import DubbingVoiceModal from '../components/editor/DubbingVoiceModal';
import FacelessGeneratorModal from '../components/editor/FacelessGeneratorModal';
import SocialPackGeneratorModal from '../components/editor/SocialPackGeneratorModal';
import { autoDetectBRollOverlays } from '../services/brollService';
import { Loader2, Save, ArrowLeft, AlertTriangle, Check, Share2, Copy, Sparkles, X, Pause, Play, XCircle, Pencil, Undo2, Redo2, Video, Wand2 } from 'lucide-react';

const TARGET_STYLE_MAP = {
  english: '🇬🇧 Pure English',
  telugu: '🇮🇳 Pure Telugu',
  hindi: '🇮🇳 Pure Hindi',
  tel_eng: '⚡ Tanglish',
  hin_eng: '⚡ Hinglish',
  hin_tel: '🌶️ Hin + Tel',
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

  // Social Post & AI Media Modal state
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showDubbingModal, setShowDubbingModal] = useState(false);
  const [showFacelessModal, setShowFacelessModal] = useState(false);
  const [brollLoading, setBrollLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialData, setSocialData] = useState(null);
  const [copiedIg, setCopiedIg] = useState(false);
  const [copiedYt, setCopiedYt] = useState(false);

  const handleAutoInsertBRoll = async () => {
    if (!timeline || !timeline.segments || timeline.segments.length === 0) {
      toast.error('No timeline segments found to generate B-Roll!');
      return;
    }

    setBrollLoading(true);
    toast.loading('🎬 AI is generating photorealistic AI video clips via Hunyuan & LTX models...', { id: 'broll-toast' });

    try {
      const res = await autoDetectBRollOverlays(timeline.segments);
      if (res?.success && Array.isArray(res.overlays)) {
        const updatedTimeline = {
          ...timeline,
          brollOverlays: res.overlays,
        };
        setTimeline(updatedTimeline);
        await updateProjectTimeline(projectId, updatedTimeline);
        toast.success(`✨ Added ${res.overlays.length} HD B-Roll overlays (${res.keywords.slice(0, 3).join(', ')})!`, { id: 'broll-toast' });
      } else {
        toast.error('No matching B-Roll clips found', { id: 'broll-toast' });
      }
    } catch (err) {
      console.error(err);
      toast.error(`B-Roll error: ${err.message}`, { id: 'broll-toast' });
    } finally {
      setBrollLoading(false);
    }
  };

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
    setTimeline(null);
    setLoading(true);
    setError(null);

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
              if (timeRes.data?.aspectRatio) {
                setAspectRatio(timeRes.data.aspectRatio);
              }
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

  const handleCopyAll = () => {
    if (!socialData) return;
    const igText = socialData.instagram ? `📸 INSTAGRAM REEL:\n${socialData.instagram.caption}\n\n${socialData.instagram.hashtags?.join(' ')}` : '';
    const ytText = socialData.youtubeShorts ? `🎬 YOUTUBE SHORTS:\n${socialData.youtubeShorts.title}\n\n${socialData.youtubeShorts.description}\n\n${socialData.youtubeShorts.hashtags?.join(' ')}` : '';
    const fullContent = `${igText}\n\n====================\n\n${ytText}`;
    navigator.clipboard.writeText(fullContent);
    toast.success('🔥 Copied complete Instagram + YouTube Viral Pack!', { id: 'copy-all-toast', duration: 3000 });
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
              onClick={() => {
                setAspectRatio('9:16');
                setTimeline(prev => prev ? { ...prev, aspectRatio: '9:16' } : prev);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${
                aspectRatio === '9:16'
                  ? 'bg-yellow-500 dark:bg-yellow-400 text-black shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📱 9:16 Reel
            </button>
            <button
              onClick={() => {
                setAspectRatio('16:9');
                setTimeline(prev => prev ? { ...prev, aspectRatio: '16:9' } : prev);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${
                aspectRatio === '16:9'
                  ? 'bg-yellow-500 dark:bg-yellow-400 text-black shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🎬 16:9 Wide
            </button>
            <button
              onClick={() => {
                setAspectRatio('1:1');
                setTimeline(prev => prev ? { ...prev, aspectRatio: '1:1' } : prev);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${
                aspectRatio === '1:1'
                  ? 'bg-yellow-500 dark:bg-yellow-400 text-black shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ⏹️ 1:1 Square
            </button>
            <button
              onClick={() => {
                setAspectRatio('4:5');
                setTimeline(prev => prev ? { ...prev, aspectRatio: '4:5' } : prev);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${
                aspectRatio === '4:5'
                  ? 'bg-yellow-500 dark:bg-yellow-400 text-black shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📱 4:5 Feed
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 font-bold text-xs">
            <span className="opacity-75">Script Mode:</span>
            <span>{TARGET_STYLE_MAP[timeline?.targetStyle] || TARGET_STYLE_MAP['auto']}</span>
          </div>

          {timeline?.dubbedAudioUrl && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 font-bold text-xs shadow-sm">
              <span className="animate-pulse">🎙️</span>
              <span>Dubbed Audio: {(timeline.dubbedLanguage || 'DUB').toUpperCase()} ({timeline.dubbedProvider || 'edge'})</span>
              <button
                onClick={async () => {
                  const resetTimeline = { ...timeline, dubbedAudioUrl: null, dubbedLanguage: null, dubbedProvider: null };
                  setTimeline(resetTimeline);
                  await updateProjectTimeline(projectId, resetTimeline);
                  toast.success('Switched back to original video audio track!');
                }}
                className="text-[10px] bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 px-1.5 py-0.5 rounded transition cursor-pointer ml-1"
                title="Remove dubbed audio and restore original video sound"
              >
                Reset Original
              </button>
            </div>
          )}
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

          {/* AI B-Roll Auto-Inserter Button */}
          <button
            onClick={handleAutoInsertBRoll}
            disabled={brollLoading}
            className="px-3 sm:px-4 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 whitespace-nowrap active:scale-95 cursor-pointer disabled:opacity-50"
            title="Auto-detect visual keywords & insert AI video clips ($0 API)"
          >
            {brollLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            ) : (
              <Video className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
            )}
            <span>AI B-Roll</span>
          </button>

          {/* Prompt-to-Video Faceless Reel Button */}
          <button
            onClick={() => setShowFacelessModal(true)}
            className="px-3 sm:px-4 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
            title="Generate Faceless Reel (Script + Voice + Background + Subtitles) from Text Prompt"
          >
            <Wand2 className="w-3.5 h-3.5 shrink-0 text-black" />
            <span>Faceless Reel</span>
          </button>

          {/* Dubbing & Voice Studio Button */}
          <button
            onClick={() => setShowDubbingModal(true)}
            className="px-3 sm:px-4 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-400 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
            title="Open AI Voice Studio & Dubbing"
          >
            <span className="text-sm">🎙️</span>
            <span>Dubbing Studio</span>
          </button>

          {/* AI Post Generator Button */}
          <button
            onClick={handleOpenSocialModal}
            className="px-3 sm:px-4 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-500 hover:to-rose-400 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-purple-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
            title="Generate 1-Click Viral Instagram Caption, Title & Hashtags"
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" />
            <span>🚀 Viral Post Pack</span>
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

      <SocialPackGeneratorModal
        isOpen={showSocialModal}
        onClose={() => setShowSocialModal(false)}
        socialLoading={socialLoading}
        socialData={socialData}
        handleCopyAll={handleCopyAll}
        handleCopyIg={handleCopyIg}
        handleCopyYt={handleCopyYt}
        copiedIg={copiedIg}
        copiedYt={copiedYt}
      />

      {/* AI Voice Studio & Dubbing Modal */}
      <DubbingVoiceModal
        isOpen={showDubbingModal}
        onClose={() => setShowDubbingModal(false)}
        initialText={timeline?.segments?.map((s) => s.text).join(' ') || ''}
        projectId={projectId}
        onApplyAudio={async (dubbingResult) => {
          if (!timeline) return;

          let updatedSegments = timeline.segments;
          if (dubbingResult.scriptText && Array.isArray(timeline.segments) && timeline.segments.length > 0) {
            const words = dubbingResult.scriptText.split(/\s+/).filter(Boolean);
            if (words.length > 0) {
              const totalSegs = timeline.segments.length;
              const baseWordsPerSeg = Math.floor(words.length / totalSegs);
              const remainder = words.length % totalSegs;

              let wordIndex = 0;
              updatedSegments = timeline.segments.map((seg, idx) => {
                const count = baseWordsPerSeg + (idx < remainder ? 1 : 0);
                const segWords = count > 0 && wordIndex < words.length 
                  ? words.slice(wordIndex, wordIndex + count) 
                  : (wordIndex < words.length ? [words[wordIndex++]] : [words[words.length - 1]]);

                if (count > 0 && wordIndex < words.length) {
                  wordIndex += count;
                }

                const segText = segWords.join(' ');
                const segDuration = Math.max(0.5, seg.end - seg.start);
                const wordDuration = segDuration / Math.max(1, segWords.length);

                return {
                  ...seg,
                  text: segText,
                  words: segWords.map((w, wIdx) => ({
                    id: `w_${seg.id}_${wIdx}_${Date.now()}`,
                    word: w,
                    start: Number((seg.start + wIdx * wordDuration).toFixed(2)),
                    end: Number((seg.start + (wIdx + 1) * wordDuration).toFixed(2)),
                  })),
                };
              });
            }
          }

          const updatedTimeline = {
            ...timeline,
            segments: updatedSegments,
            dubbedAudioUrl: dubbingResult.audioUrl,
            dubbedLanguage: dubbingResult.language,
            dubbedProvider: dubbingResult.provider,
          };
          setTimeline(updatedTimeline);

          try {
            await updateProjectTimeline(projectId, updatedTimeline);
            toast.success(`✨ Dubbed voiceover (${dubbingResult.language.toUpperCase()}) applied & saved to timeline!`);
          } catch (err) {
            console.error(err);
            toast.error(`Applied locally, but DB save failed: ${err.message}`);
          }
        }}
      />

      {/* Prompt-to-Video Faceless Reel Generator Modal */}
      <FacelessGeneratorModal
        isOpen={showFacelessModal}
        onClose={() => setShowFacelessModal(false)}
        onProjectCreated={(newProjectId) => {
          window.location.href = `/editor/${newProjectId}`;
        }}
      />
    </div>
  );
}
