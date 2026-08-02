import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import EditorHeaderBar from '../components/editor/EditorHeaderBar';
import EditorModals from '../components/editor/EditorModals';
import EditorMobileDock from '../components/editor/EditorMobileDock';
import EditorProcessingState from '../components/editor/EditorProcessingState';
import { copyIgPost, copyYtPost, copyAllSocialPosts } from '../components/editor/utils/editorSocialUtils';
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
  const navigate = useNavigate();
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
        if (projRes.success && projRes.data) {
          setProject(projRes.data);
          setInitialFetch(false);

          let realTimeline = projRes.data.timeline || projRes.data.caption_timeline || null;
          if (typeof realTimeline === 'string') {
            try { realTimeline = JSON.parse(realTimeline); } catch (_) {}
          }

          if (!realTimeline || !realTimeline.segments || realTimeline.segments.length === 0) {
            try {
              const timeRes = await getProjectTimeline(projectId);
              if (timeRes.success && timeRes.data && Array.isArray(timeRes.data.segments) && timeRes.data.segments.length > 0) {
                realTimeline = timeRes.data;
              }
            } catch (_) {}
          }

          const hasRealCaptionData = realTimeline && Array.isArray(realTimeline.segments) && realTimeline.segments.length > 0;
          const isStatusFinished = ['completed', 'failed', 'cancelled', 'ready'].includes(projRes.data.status);

          let activeTimeline = realTimeline;
          if (!activeTimeline || (!activeTimeline.segments && !activeTimeline.words)) {
            activeTimeline = {
              version: '1.0',
              videoUrl: projRes.data.video_url || projRes.data.video_path || '',
              duration: projRes.data.duration || 30,
              aspectRatio: '9:16',
              globalTheme: {
                presetName: 'BOLD_VIRAL',
                primaryColor: '#FFFFFF',
                highlightColor: '#00FFFF',
                fontFamily: 'Montserrat',
              },
              tracks: [
                {
                  id: 'track-video-1',
                  type: 'video',
                  label: 'AI Reel Video',
                  clips: [
                    {
                      id: 'clip-video-1',
                      startTime: 0,
                      endTime: projRes.data.duration || 30,
                      src: projRes.data.video_url || projRes.data.video_path || '',
                      type: 'video',
                    },
                  ],
                },
              ],
              words: [],
              segments: [],
              style: {
                preset: 'BOLD_VIRAL',
                textColor: '#FFFFFF',
                highlightColor: '#00FFFF',
                fontSize: 48,
              },
            };
          }

          setTimeline(activeTimeline);
          if (activeTimeline.aspectRatio) setAspectRatio(activeTimeline.aspectRatio);

          if (hasRealCaptionData || isStatusFinished) {
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

  const handleRestartGeneration = async () => {
    if (!project) return;
    toast.loading('Restarting AI caption generation...', { id: 'restart-toast' });
    try {
      await resumeProject(projectId);
      setProject((p) => (p ? { ...p, status: 'transcribing' } : p));
      setLoading(true);
      setError(null);
      toast.success('Generation restarted!', { id: 'restart-toast' });
    } catch (err) {
      toast.error(`Restart failed: ${err.message}`, { id: 'restart-toast' });
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
    if (!timeline || !Array.isArray(timeline.segments)) {
      toast.error('Cannot save empty or loading timeline.', { id: 'save-toast' });
      return;
    }
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

  const handleCopyIg = () => copyIgPost(socialData, setCopiedIg);
  const handleCopyYt = () => copyYtPost(socialData, setCopiedYt);
  const handleCopyAll = () => copyAllSocialPosts(socialData);

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
      <EditorProcessingState
        loading={loading}
        initialFetch={initialFetch}
        project={project}
        pausing={pausing}
        cancelling={cancelling}
        error={error}
        activeStyle={activeStyle}
        handlePauseResumeToggle={handlePauseResumeToggle}
        handleCancelGeneration={handleCancelGeneration}
        handleRestartGeneration={handleRestartGeneration}
        onBack={onBack}
      />
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
      <EditorHeaderBar
        project={project}
          isEditingTitle={isEditingTitle}
          titleInput={titleInput}
          setTitleInput={setTitleInput}
          handleStartRename={() => {
            setTitleInput(project?.title || '');
            setIsEditingTitle(true);
          }}
          handleCancelRename={() => setIsEditingTitle(false)}
          handleSaveTitle={handleSaveTitle}
          savingTitle={renamingTitle}
          navigate={navigate}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          handleAutoInsertBRoll={handleAutoInsertBRoll}
          brollLoading={brollLoading}
          setShowFacelessModal={setShowFacelessModal}
          setShowDubbingModal={setShowDubbingModal}
          handleOpenSocialModal={handleOpenSocialModal}
          handleSaveTimeline={handleSaveTimeline}
          saving={saving}
          saveSuccess={saveSuccess}
        />

      {/* 3-Column Studio Grid Layout (Side-by-Side Left-to-Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start w-full max-w-full overflow-x-hidden">
        {/* 1. Preset & Style Sidebar (Left Column - 4 cols) */}
        <div className={`order-1 lg:col-span-4 w-full ${mobileTab === 'presets' ? 'block' : 'hidden lg:block'}`}>
          <PresetSidebar timeline={timeline} setTimeline={setTimeline} />
        </div>

        {/* 2. Canvas Video Player Studio (Middle Column - 4 cols) */}
        <div className={`order-2 lg:col-span-4 flex justify-center w-full ${mobileTab === 'player' ? 'block' : 'hidden lg:block'}`}>
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

        {/* 3. Subtitles & Timing Studio (Right Column - 4 cols) */}
        <div className={`order-3 lg:col-span-4 w-full ${mobileTab === 'editor' ? 'block' : 'hidden lg:block'}`}>
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

      <EditorMobileDock
        mobileTab={mobileTab}
        setMobileTab={setMobileTab}
        handleSaveTimeline={handleSaveTimeline}
        saving={saving}
      />

      <EditorModals
        showSocialModal={showSocialModal}
        setShowSocialModal={setShowSocialModal}
        socialLoading={socialLoading}
        socialData={socialData}
        handleCopyAll={handleCopyAll}
        handleCopyIg={handleCopyIg}
        handleCopyYt={handleCopyYt}
        copiedIg={copiedIg}
        copiedYt={copiedYt}
        showDubbingModal={showDubbingModal}
        setShowDubbingModal={setShowDubbingModal}
        timeline={timeline}
        setTimeline={setTimeline}
        projectId={projectId}
        updateProjectTimeline={updateProjectTimeline}
        showFacelessModal={showFacelessModal}
        setShowFacelessModal={setShowFacelessModal}
      />
    </div>
  );
}
