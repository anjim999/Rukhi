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
import { Loader2, Save, ArrowLeft, AlertTriangle, Check, Share2, Copy, Sparkles, X, Pause, Play, XCircle, Pencil } from 'lucide-react';

export default function EditorPage({ projectId, onBack }) {
  const [project, setProject] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [pausing, setPausing] = useState(false);

  // Title edit state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [renamingTitle, setRenamingTitle] = useState(false);

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
    const isPaused = project?.status === 'paused';

    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className={`w-16 h-16 rounded-2xl ${isPaused ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'} border flex items-center justify-center`}>
          {isPaused ? <Pause className="w-8 h-8" /> : <Loader2 className="w-8 h-8 animate-spin" />}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            {isPaused ? 'Generation Paused' : 'Generating AI Captions...'}
          </h2>
          <p className="text-sm text-zinc-400 max-w-sm">
            {isPaused
              ? 'Processing is paused. Click Resume to continue generating subtitles.'
              : 'Transcribing speech audio with Gemini 2.5 Flash and generating kinetic reel subtitles.'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-yellow-400/80 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
          <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-yellow-400 animate-pulse'}`} />
          Status: {project?.status || 'transcribing'}
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

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-2">Processing Error</h3>
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-red-400 leading-relaxed text-left break-words">
            {error}
          </div>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>
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
    <div className="space-y-6 pb-12">
      {/* Editor Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800/80 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 mb-1">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  autoFocus
                  className="bg-zinc-950 border border-yellow-500/50 rounded-lg px-2.5 py-1 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
                <button
                  onClick={handleSaveTitle}
                  disabled={renamingTitle}
                  className="p-1 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black transition"
                  title="Save title"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 mb-1 group cursor-pointer"
                onClick={() => {
                  setTitleInput(project?.title || '');
                  setIsEditingTitle(true);
                }}
                title="Click to edit project title"
              >
                <h1 className="text-base font-bold text-white leading-none group-hover:text-yellow-400 transition">
                  {project?.title || 'Untitled Video Project'}
                </h1>
                <button className="text-zinc-500 group-hover:text-yellow-400 opacity-70 group-hover:opacity-100 transition">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-xs text-zinc-400">
              Kinetic Subtitle Studio • {timeline?.segments?.length || 0} Timeblocks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Post Generator Button */}
          <button
            onClick={handleOpenSocialModal}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>AI Post Generator (IG & YT)</span>
          </button>

          {/* Save Timeline Button */}
          <button
            onClick={handleSaveTimeline}
            disabled={saving}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              saveSuccess
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5 text-white" />
            ) : (
              <Save className="w-3.5 h-3.5 text-yellow-400" />
            )}
            <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Progress'}</span>
          </button>
        </div>
      </div>

      {/* 3-Column Studio Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Preset & Style Sidebar */}
        <div className="lg:col-span-3">
          <PresetSidebar timeline={timeline} setTimeline={setTimeline} />
        </div>

        {/* Middle Column: 60fps Canvas Video Player */}
        <div className="lg:col-span-5 flex justify-center">
          <CanvasVideoPlayer
            projectId={projectId}
            videoUrl={videoFullUrl}
            timeline={timeline}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            projectTitle={project?.title}
          />
        </div>

        {/* Right Column: Time-Frame Granular Editor */}
        <div className="lg:col-span-4">
          <TimelineEditor
            timeline={timeline}
            setTimeline={setTimeline}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
          />
        </div>
      </div>

      {/* AI Instagram & YouTube Post Generator Modal */}
      {showSocialModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar relative shadow-2xl">
            <button
              onClick={() => setShowSocialModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-bold text-white">AI Post-Ready Content Pack</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Zero-hallucination captions, titles, and viral #hashtags generated directly from your video transcript.
            </p>

            {socialLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
                <p className="text-xs text-zinc-300 font-semibold">Analyzing transcript & generating viral #hashtags...</p>
              </div>
            ) : socialData ? (
              <div className="space-y-5">
                {/* Instagram Reels Pack */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                      📸 Instagram Reels Pack
                    </span>
                    <button
                      onClick={handleCopyIg}
                      className="px-3 py-1.5 rounded-lg bg-pink-500/20 border border-pink-500/40 text-pink-300 hover:bg-pink-500/30 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      {copiedIg ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIg ? 'Copied!' : 'Copy IG Pack'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {socialData.instagram?.caption}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {socialData.instagram?.hashtags?.map((tag) => (
                      <span key={tag} className="text-[11px] font-mono text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* YouTube Shorts Pack */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      🎬 YouTube Shorts Pack
                    </span>
                    <button
                      onClick={handleCopyYt}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      {copiedYt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedYt ? 'Copied!' : 'Copy YT Pack'}</span>
                    </button>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Viral Title</span>
                    <p className="text-xs font-bold text-white">{socialData.youtubeShorts?.title}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Description</span>
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{socialData.youtubeShorts?.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {socialData.youtubeShorts?.hashtags?.map((tag) => (
                      <span key={tag} className="text-[11px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
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
