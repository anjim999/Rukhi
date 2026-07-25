import React, { useState, useEffect, useRef } from 'react';
import { getProject, getProjectTimeline, updateProjectTimeline } from '../services/projectService';
import CanvasVideoPlayer from '../components/editor/CanvasVideoPlayer';
import PresetSidebar from '../components/editor/PresetSidebar';
import TimelineEditor from '../components/editor/TimelineEditor';
import { Loader2, Save, Download, ArrowLeft, AlertTriangle, Check } from 'lucide-react';

export default function EditorPage({ projectId, onBack }) {
  const [project, setProject] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Poll project and timeline until processing is complete
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
          } else if (projRes.data.status === 'failed') {
            setError(projRes.data.error_message || 'Media processing failed. Please try re-uploading the video.');
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

  const handleSaveTimeline = async () => {
    if (!timeline) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateProjectTimeline(projectId, timeline);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            Generating AI Captions...
          </h2>
          <p className="text-sm text-zinc-400 max-w-sm">
            Transcribing speech audio with Gemini 2.5 Flash and generating kinetic reel subtitles.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-yellow-400/80 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          Status: {project?.status || 'transcribing'}
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
          className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white">
              {project?.title || 'Caption Editor'}
            </h2>
            <p className="text-xs text-zinc-400">
              Zero-latency Canvas Live Preview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveTimeline}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold hover:bg-zinc-800 transition flex items-center gap-1.5"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-400" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Save className="w-3.5 h-3.5 text-yellow-400" />
            )}
            {saveSuccess ? 'Saved!' : 'Save Timeline'}
          </button>
        </div>
      </div>

      {/* Main 3-Column Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset Sidebar */}
        <div className="lg:col-span-3">
          <PresetSidebar timeline={timeline} setTimeline={setTimeline} />
        </div>

        {/* Center Column: Live Canvas Video Player with Progress Bar & Export */}
        <div className="lg:col-span-5 flex justify-center">
          <CanvasVideoPlayer
            videoUrl={project?.video_url}
            timeline={timeline}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
          />
        </div>

        {/* Right Column: Timeline Word Editor */}
        <div className="lg:col-span-4">
          <TimelineEditor
            timeline={timeline}
            setTimeline={setTimeline}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
          />
        </div>
      </div>
    </div>
  );
}
