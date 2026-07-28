import React, { useState, useEffect } from 'react';
import { X, Sparkles, Video, Wand2, Globe, Volume2, Check, Loader2, ArrowRight, FileText, RotateCcw, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateFacelessReel, generateScriptOnly } from '../../services/brollService';

const SAMPLE_PROMPTS = [
  { 
    label: '💻 Tech Founder Vikram', 
    prompt: '28-year-old tech entrepreneur Vikram building his AI flying car startup',
    scriptText: 'Late at night in a silent workshop, 28-year-old tech entrepreneur Vikram works relentlessly to build his dream AI startup. Through endless failures and mockery, he never lost courage. Behind every line of code lies his intense dedication. Today, the future of flying technology is born right in his hands.'
  },
  { 
    label: '😂 3 Crazy Best Friends', 
    prompt: '3 crazy best friends having non-stop fun and pulling pranks',
    scriptText: 'When 3 crazy best friends get together, non-stop laughter and silly pranks are guaranteed! Pulling jokes, laughing until your stomach hurts, and creating wild memories are the best parts of life. Having true friends who make you smile every single day is a true blessing.'
  },
  { 
    label: '🌌 Space & Black Hole Mysteries', 
    prompt: 'Unexplained mysteries of outer space, black holes, and galaxies',
    scriptText: 'The universe is an infinite world of breathtaking secrets. Billions of glowing stars, vast galaxies, and gravitational mysteries continue to amaze science every single day. Outer space proves that human curiosity has no limits. Let us journey deep into the cosmos.'
  },
  { 
    label: '🔥 Stoic Discipline for Success', 
    prompt: 'Daily stoic rules about hard work and discipline for success',
    scriptText: 'To achieve true greatness in life, you must work with relentless discipline every single day. Never lose courage when faced with failures. Every new morning brings a fresh opportunity. Believe in yourself and keep pushing forward until your dreams become reality.'
  },
  { 
    label: '🎬 Cinematic College Love Story', 
    prompt: 'Emotional B.Tech college romance story of Anji and Rukhiyaa',
    scriptText: 'A beautiful four-year college love story. Secretly loving someone for four full years of engineering without ever expressing feelings. Finally, on graduation day at the college gate, he gathers courage and confesses his love. Two hearts connect forever.'
  },
];

const TARGET_LANGUAGES = [
  { code: 'en', label: '🇬🇧 English', badge: 'Global' },
  { code: 'te', label: '🇮🇳 Telugu (తెలుగు)', badge: 'Native' },
  { code: 'hi', label: '🇮🇳 Hindi (हिंदी)', badge: 'Popular' },
];

const DURATION_OPTIONS = [
  { value: 15, label: '⚡ 15s', subtitle: 'Short & Punchy' },
  { value: 30, label: '🚀 30s', subtitle: 'Standard Short' },
  { value: 60, label: '⏱️ 60s', subtitle: '1 Min Short' },
  { value: 180, label: '🎞️ 3 Min', subtitle: 'Long Reel' },
  { value: 300, label: '🎥 5 Min', subtitle: '5 Min Video' },
  { value: 600, label: '📹 10 Min', subtitle: '10 Min Story' },
  { value: 1200, label: '📽️ 20 Min', subtitle: '20 Min Master' },
  { value: 1800, label: '📺 30 Min', subtitle: '30 Min Full Movie' },
];

const VISUAL_MODES = [
  { id: 'cinematic', label: '🎬 HunyuanVideo 1.5', subtitle: 'Tencent Photorealistic 8-Step Engine' },
  { id: 'dark_aesthetic', label: '🚀 LTX-Video 2.3', subtitle: 'Lightricks High-Dynamic Motion Engine' },
  { id: 'viral_short', label: '⚡ Wan 2.1 AI', subtitle: 'Open-Source AI Motion Engine' },
];

const ASPECT_RATIOS = [
  { id: '9:16', label: '📱 9:16 Vertical', subtitle: 'Reels / Shorts / TikTok' },
  { id: '16:9', label: '📺 16:9 Landscape', subtitle: 'YouTube Main / TV' },
  { id: '1:1', label: '🔳 1:1 Square', subtitle: 'Instagram Feed' },
  { id: '4:5', label: '📱 4:5 Portrait', subtitle: 'Instagram Feed' },
];

export default function FacelessGeneratorModal({ isOpen, onClose, onProjectCreated }) {
  const [prompt, setPrompt] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [step, setStep] = useState('input'); // 'input' | 'preview'
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [voiceProvider, setVoiceProvider] = useState('edge');
  const [durationSec, setDurationSec] = useState(30);
  const [visualMode, setVisualMode] = useState('cinematic');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Clear modal prompt & script state on open so it starts fresh every time
  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setScriptText('');
      setStep('input');
    }
  }, [isOpen]);

  const handleSelectAspect = (id) => {
    setAspectRatio(id);
    localStorage.setItem('auto_captions_last_aspect', id);
  };

  const handlePromptChange = (newPrompt) => {
    setPrompt(newPrompt);
    setScriptText('');
    localStorage.removeItem('auto_captions_last_script');
  };

  const handleSelectSample = (sample) => {
    setPrompt(sample.prompt);
    setScriptText(sample.scriptText);
    setTargetLanguage('en');

    setStep('preview');
    localStorage.setItem('auto_captions_last_prompt', sample.prompt);
    localStorage.setItem('auto_captions_last_script', sample.scriptText);
    toast.success(`📋 Loaded full script for "${sample.label}"! (Gemini API skipped)`);
  };

  if (!isOpen) return null;

  const handleClearForm = () => {
    setPrompt('');
    setScriptText('');
    setStep('input');
    localStorage.removeItem('auto_captions_last_prompt');
    localStorage.removeItem('auto_captions_last_script');
    toast.success('🧹 Cleared prompt and script memory!');
  };

  const handleLoadPrevious = () => {
    const savedPrompt = localStorage.getItem('auto_captions_last_prompt');
    const savedScript = localStorage.getItem('auto_captions_last_script');
    if (savedPrompt) {
      setPrompt(savedPrompt);
      if (savedScript) {
        setScriptText(savedScript);
        setStep('preview');
      }
      toast.success('📋 Loaded previous prompt & script from cache!');
    } else {
      toast.error('No cached previous prompt found.');
    }
  };

  const handleGenerateScriptPreview = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a video prompt or choose a template!');
      return;
    }

    setIsGenerating(true);
    setStatusMessage('✍️ Generating full script preview via Gemini 2.5 Flash ($0)...');

    try {
      // Save prompt to local cache
      localStorage.setItem('auto_captions_last_prompt', prompt.trim());

      const res = await generateScriptOnly({
        prompt: prompt.trim(),
        targetLanguage,
        durationSec,
      });

      if (res?.success && res.scriptText) {
        setScriptText(res.scriptText);
        localStorage.setItem('auto_captions_last_script', res.scriptText);
        setStep('preview');
        toast.success('✍️ Script generated! You can review or edit it below before creating your video.');
      } else {
        toast.error(res?.error || 'Failed to generate script');
      }
    } catch (err) {
      console.error(err);
      toast.error(`Script error: ${err?.response?.data?.error || err.message}`);
    } finally {
      setIsGenerating(false);
      setStatusMessage('');
    }
  };

  const handleBuildVideo = async () => {
    if (!prompt.trim() && !scriptText.trim()) {
      toast.error('Script or prompt is required!');
      return;
    }

    setIsGenerating(true);
    setStatusMessage('🎙️ Synthesizing multi-lingual voiceover audio...');

    try {
      if (prompt.trim()) localStorage.setItem('auto_captions_last_prompt', prompt.trim());
      if (scriptText.trim()) localStorage.setItem('auto_captions_last_script', scriptText.trim());

      setTimeout(() => setStatusMessage('🚀 Generating real AI video clips via Hunyuan & LTX AI models...'), 3000);
      setTimeout(() => setStatusMessage('⏱️ Measuring exact audio duration & building timeline...'), 6000);

      const res = await generateFacelessReel({
        prompt: prompt.trim() || 'AI Story',
        scriptText: scriptText.trim() ? scriptText.trim() : null,
        targetLanguage,
        voiceProvider,
        durationSec,
        visualMode,
        aspectRatio,
      });

      if (res?.success && res.projectId) {
        toast.success('🚀 AI Faceless Video generated successfully!');
        if (onProjectCreated) {
          onProjectCreated(res.projectId);
        }
        onClose();
      } else {
        toast.error(res?.error || 'Failed to generate faceless video');
      }
    } catch (err) {
      console.error(err);
      toast.error(`Generation error: ${err?.response?.data?.error || err.message}`);
    } finally {
      setIsGenerating(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/20">
              <Wand2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Prompt-to-Video Production Generator
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                  $0 Cost Engine
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Generate long-form cinematic videos (up to 30 mins) with Script Preview & Prompt Cache</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Quick Toolbar: Previous Prompt & Cache Button */}
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-zinc-800/50">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('input')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  step === 'input'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                1. Prompt & Settings
              </button>
              {scriptText && (
                <button
                  type="button"
                  onClick={() => setStep('preview')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    step === 'preview'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  2. Script Preview ({scriptText.split(/\s+/).filter(Boolean).length} words)
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearForm}
                className="px-2.5 py-1 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-bold transition cursor-pointer border border-zinc-700/60"
                title="Clear current prompt & script"
              >
                🧹 Clear Form
              </button>

              <button
                type="button"
                onClick={handleLoadPrevious}
                className="px-3 py-1 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-yellow-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-zinc-700/60"
                title="Load previous prompt & script from local memory"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>📋 Load Cached</span>
              </button>
            </div>
          </div>

          {step === 'input' ? (
            <>
              {/* Quick Template Pills */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Viral Templates</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_PROMPTS.map((sample) => (
                    <button
                      key={sample.label}
                      onClick={() => handleSelectSample(sample)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        prompt === sample.prompt
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm'
                          : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:text-white hover:border-zinc-600'
                      }`}
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Prompt Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 block">Video Story Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  rows={4}
                  placeholder="e.g. Create a 3-minute Telugu college romance story about a guy who loved a girl for 4 years..."
                  className="w-full p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500 transition shadow-inner resize-y"
                />
              </div>

              {/* Visual Aesthetic Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Visual Aesthetic Mode</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {VISUAL_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setVisualMode(mode.id)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        visualMode === mode.id
                          ? 'bg-purple-500/20 border-purple-500/60 text-purple-200 ring-2 ring-purple-500/30'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{mode.label}</div>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">{mode.subtitle}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Target Voiceover Language</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TARGET_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setTargetLanguage(lang.code)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        targetLanguage === lang.code
                          ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-200 ring-2 ring-indigo-500/30'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{lang.label}</div>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">{lang.badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Video Duration Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Target Video Length</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDurationSec(opt.value)}
                      className={`p-2.5 rounded-2xl border text-center transition cursor-pointer ${
                        durationSec === opt.value
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 ring-2 ring-emerald-500/30 font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-extrabold">{opt.label}</div>
                      <span className="text-[9px] opacity-70 block truncate">{opt.subtitle}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio Frame Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Frame Aspect Ratio</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => handleSelectAspect(ratio.id)}
                      className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                        aspectRatio === ratio.id
                          ? 'bg-yellow-500/20 border-yellow-500/60 text-yellow-300 ring-2 ring-yellow-500/30 font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{ratio.label}</div>
                      <span className="text-[9px] text-zinc-500 block truncate mt-0.5">{ratio.subtitle}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Engine selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Voice Engine Provider</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVoiceProvider('edge')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      voiceProvider === 'edge'
                        ? 'bg-yellow-500/15 border-yellow-500/50 text-yellow-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-bold text-xs">Edge Neural Voice</div>
                    <span className="text-[10px] text-yellow-400/80 block">Multi-lingual HD Voice (Telugu/Hindi/English)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVoiceProvider('f5_bark')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      voiceProvider === 'f5_bark'
                        ? 'bg-yellow-500/15 border-yellow-500/50 text-yellow-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-bold text-xs">F5 / Bark AI Voice</div>
                    <span className="text-[10px] text-yellow-400/80 block">Neural AI Expressive Synthesizer</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* STEP 2: EDITABLE SCRIPT PREVIEW */
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>Script Preview ({scriptText.split(/\s+/).filter(Boolean).length} Words)</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Review and edit the script below before synthesizing voiceover audio & sourcing video clips.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 cursor-pointer"
                >
                  Edit Prompt
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 block">Editable Voiceover Script</label>
                <textarea
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  rows={10}
                  className="w-full p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500 transition shadow-inner font-sans leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-zinc-800/80 bg-zinc-950 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {step === 'input' ? (
              <>
                <button
                  type="button"
                  onClick={handleGenerateScriptPreview}
                  disabled={isGenerating || !prompt.trim()}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-purple-300 font-bold text-xs border border-zinc-700/80 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Generate script preview only to edit before making video ($0 API)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>✍️ Preview Script</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuildVideo}
                  disabled={isGenerating || !prompt.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Video...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Generate Video</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleBuildVideo}
                disabled={isGenerating || !scriptText.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Building Video...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>🚀 Build Video from Approved Script</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
