import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Video, Wand2, Globe, Volume2, Check, Loader2, Play, UserCheck, Layers, Clock, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateFacelessReel } from '../../services/brollService';

const SAMPLE_TOPICS = [
  { 
    label: '💻 Tech Founder Vikram', 
    prompt: '28-year-old tech entrepreneur building an AI startup',
    style: 'ENTREPRENEUR',
  },
  { 
    label: '🧘 Stoic Discipline & Success', 
    prompt: '5 stoic daily rules for hard work, discipline, and success',
    style: 'ENTREPRENEUR',
  },
  { 
    label: '⚡ 3 Daily Habits for Wealth', 
    prompt: '3 morning habits to build wealth and personal focus',
    style: 'TECH_GURU',
  },
  { 
    label: '🌌 Universe & Space Secrets', 
    prompt: 'Unexplained mysteries of black holes and deep cosmos',
    style: 'CINEMATIC_3D',
  },
  { 
    label: '💪 Fitness & Gym Transformation', 
    prompt: 'How to build unstoppable mental tough discipline in gym',
    style: 'FITNESS_COACH',
  },
];

const CHARACTER_STYLES = [
  { id: 'ENTREPRENEUR', label: '💼 Tech Founder', subtitle: 'Navy blazer, modern studio' },
  { id: 'FEMALE_VLOGGER', label: '📸 Vlogger Girl', subtitle: 'Stylish casual, warm lighting' },
  { id: 'ANIME_HERO', label: '⚔️ Anime Hero', subtitle: 'Hyper 3D anime aesthetic' },
  { id: 'CINEMATIC_3D', label: '🎨 Pixar 3D', subtitle: 'Colorful soft 3D animation' },
  { id: 'FITNESS_COACH', label: '💪 Gym Coach', subtitle: 'Athletic, high energy' },
  { id: 'TECH_GURU', label: '⚡ Cyber Tech', subtitle: 'Neon background, glasses' },
];

const TARGET_LANGUAGES = [
  { code: 'chatting', label: '💬 Chatting (Telglish)', badge: 'Recommended' },
  { code: 'te', label: '🇮🇳 Telugu (తెలుగు)', badge: 'Native' },
  { code: 'hi', label: '🇮🇳 Hindi (हिंदी)', badge: 'Popular' },
  { code: 'en', label: '🇬🇧 English', badge: 'Global' },
];

const DURATION_OPTIONS = [
  { value: 30, label: '🚀 30s Reel', subtitle: '6 Scenes • High Retention' },
  { value: 60, label: '⏱️ 60s Story', subtitle: '12 Scenes • Deep Topic' },
];

export default function FacelessGeneratorModal({ isOpen, onClose, onProjectCreated, onSuccess }) {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [characterStyle, setCharacterStyle] = useState('ENTREPRENEUR');
  const [targetLanguage, setTargetLanguage] = useState('chatting');
  const [durationSec, setDurationSec] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setCharacterStyle('ENTREPRENEUR');
      setTargetLanguage('chatting');
      setDurationSec(30);
      setIsGenerating(false);
      setProgressPercent(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectSample = (sample) => {
    setPrompt(sample.prompt);
    setCharacterStyle(sample.style);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a video topic or prompt!');
      return;
    }

    setIsGenerating(true);
    setProgressPercent(10);
    setProgressStage('Designing Master Character Avatar...');

    try {
      // Stage progress simulation
      const timer1 = setTimeout(() => {
        setProgressPercent(35);
        setProgressStage('Creating Storyboard Script...');
      }, 1500);

      const timer2 = setTimeout(() => {
        setProgressPercent(60);
        setProgressStage('Generating Veo Video Clips...');
      }, 3500);

      const timer3 = setTimeout(() => {
        setProgressPercent(85);
        setProgressStage('Synthesizing Voiceover & Captions...');
      }, 6000);

      const result = await generateFacelessReel({
        prompt: prompt.trim(),
        stylePreset: characterStyle,
        targetLanguage,
        durationSec,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      setProgressPercent(100);
      setProgressStage('✅ AI Reel Ready!');
      toast.success('🎉 Consistent Character AI Reel Generated Successfully!');

      const targetId = result?.reelId || result?.project?.id || result?.id;
      if (typeof onProjectCreated === 'function') {
        onProjectCreated(targetId || result);
      }
      if (typeof onSuccess === 'function') {
        onSuccess(targetId || result);
      }
      if (typeof onProjectCreated !== 'function' && typeof onSuccess !== 'function' && targetId) {
        navigate(`/editor/${targetId}`);
      }
      onClose();
    } catch (err) {
      console.error('[AI REEL FRONTEND ERROR]', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to generate AI Reel');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
        
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">✨ AI Reel Creator</h2>
              <p className="text-xs text-slate-400">Consistent Character • 1-Click Story Video</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
          
          {/* Topic Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>1. What is your video topic?</span>
              <span className="text-[10px] text-cyan-400 font-normal">AI handles script & visuals</span>
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 5 stoic daily rules for hard work, discipline, and success..."
              className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all text-sm resize-none"
            />
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-2">
            <span className="text-xs text-slate-400 font-medium">💡 Quick Sample Ideas:</span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_TOPICS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(item)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-500/50 text-xs text-slate-300 hover:text-cyan-300 transition-all"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Character Style Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>2. Choose Master Character Style</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CHARACTER_STYLES.map((style) => {
                const isSelected = characterStyle === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => setCharacterStyle(style.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-500/20 to-indigo-500/10 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white flex items-center justify-between">
                      <span>{style.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">{style.subtitle}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language & Duration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Language */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>3. Language & Style</span>
              </label>
              <div className="space-y-2">
                {TARGET_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setTargetLanguage(lang.code)}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      targetLanguage === lang.code
                        ? 'bg-slate-800 border-cyan-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{lang.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {lang.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>4. Reel Duration</span>
              </label>
              <div className="space-y-2">
                {DURATION_OPTIONS.map((dur) => (
                  <button
                    key={dur.value}
                    onClick={() => setDurationSec(dur.value)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      durationSec === dur.value
                        ? 'bg-slate-800 border-cyan-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">{dur.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{dur.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Progress Overlay */}
          {isGenerating && (
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-3 animate-pulse">
              <div className="flex items-center justify-between text-xs text-cyan-300 font-medium">
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>{progressStage}</span>
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-2 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white text-xs font-semibold shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Reel...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>✨ Generate AI Reel</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
