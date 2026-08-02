import React, { useState, useEffect, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Clock, Edit3, Settings2, ChevronDown, ChevronUp, Scissors, GitMerge, Undo2, Redo2, Zap, MoveLeft, MoveRight, SlidersHorizontal, Sparkles, Plus, Minus, Languages, Tag, Loader2, X } from 'lucide-react';
import { THEME_PRESETS, ANIMATION_TYPES } from '../../../../shared/constants/timeline.js';
import { translateProjectTimeline, autoAddEmojisToTimeline, generateHookBannersForProject } from '../../services/projectService';
import { attachClientSideEmojis } from './utils/timelineEmojiAttacher';
import FontPickerModal from './FontPickerModal';
import CustomFontSelect from './CustomFontSelect';
import CustomSelect from './CustomSelect';

import { EMOJI_PALETTE, ANIMATION_OPTIONS_15 } from './constants/timelineOptions';

import { FONT_CATEGORIES, TIMELINE_PRESET_OPTIONS as PRESET_OPTIONS } from './constants/fontCategories';

export default function TimelineEditor({ projectId, timeline, setTimeline, currentTime, setCurrentTime, onUndo, onRedo, canUndo, canRedo }) {
  const [selectedSegId, setSelectedSegId] = useState(null);
  const [expandedSegId, setExpandedSegId] = useState(null);
  const [isStudioCollapsed, setIsStudioCollapsed] = useState(false);
  const [rippleEnabled, setRippleEnabled] = useState(true);
  const [globalShiftInput, setGlobalShiftInput] = useState('0.00');
  const [showGlobalShift, setShowGlobalShift] = useState(false);
  const [activeSegmentFontPickerId, setActiveSegmentFontPickerId] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAddingEmojis, setIsAddingEmojis] = useState(false);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [showTopBannerMenu, setShowTopBannerMenu] = useState(false);
  const [gapsFixed, setGapsFixed] = useState(true);
  const [hoverSizeVal, setHoverSizeVal] = useState(null);
  const [hoverYVal, setHoverYVal] = useState(null);

  const hasEmojis = useMemo(() => {
    if (!timeline?.segments) return false;
    return timeline.segments.some((s) => (s.words || []).some((w) => !!w.emoji));
  }, [timeline?.segments]);

  const containerRef = useRef(null);
  const itemRefs = useRef({});
  const translateMenuRef = useRef(null);
  const hookBannerRef = useRef(null);
  const globalShiftRef = useRef(null);

  // Auto-Fix micro gaps between captions by default on initial timeline load for 100% gapless sync
  useEffect(() => {
    if (!timeline || !Array.isArray(timeline.segments) || timeline._gapsAutoFixed) return;

    let fixedCount = 0;
    const repairedSegments = timeline.segments.map((seg, sIdx) => {
      const words = seg.words || [];
      const repairedWords = words.map((w, idx) => {
        if (idx === 0) return w;
        const prev = words[idx - 1];
        const gap = w.start - prev.end;
        if (gap > 0 && gap <= 0.45) {
          fixedCount++;
          return { ...w, start: prev.end };
        }
        return w;
      });

      const nextSeg = timeline.segments[sIdx + 1];
      let segEnd = seg.end;
      if (nextSeg && (nextSeg.start - seg.end > 0) && (nextSeg.start - seg.end <= 0.65)) {
        segEnd = nextSeg.start;
        fixedCount++;
      }

      return { ...seg, end: segEnd, words: repairedWords };
    });

    setTimeline((prev) => ({
      ...prev,
      segments: repairedSegments,
      _gapsAutoFixed: true,
    }));
    setGapsFixed(true);
  }, [timeline?.segments?.length]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showTranslateMenu && translateMenuRef.current && !translateMenuRef.current.contains(e.target)) {
        setShowTranslateMenu(false);
      }
      if (showGlobalShift && globalShiftRef.current && !globalShiftRef.current.contains(e.target)) {
        setShowGlobalShift(false);
      }
      if (timeline?.topBanner?.enabled && hookBannerRef.current && !hookBannerRef.current.contains(e.target)) {
        handleTopBannerChange('enabled', false);
      }
      if (activeSegmentFontPickerId) {
        setActiveSegmentFontPickerId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTranslateMenu, showGlobalShift, timeline?.topBanner?.enabled, activeSegmentFontPickerId]);

  const handleTranslate = async (targetStyle) => {
    if (!timeline || !timeline.segments || isTranslating) return;
    setIsTranslating(true);
    setShowTranslateMenu(false);
    toast.loading(`Translating captions to ${targetStyle}...`, { id: 'translate-toast' });
    try {
      const activeId = projectId || timeline.projectId || 'temp';
      const res = await translateProjectTimeline(activeId, targetStyle, timeline);
      if (res && res.data && res.data.timeline) {
        setTimeline(res.data.timeline);
        toast.success(`Captions translated to ${targetStyle} with 100% audio sync!`, { id: 'translate-toast' });
      } else {
        toast.error('Translation response empty.', { id: 'translate-toast' });
      }
    } catch (err) {
      console.error('[TRANSLATE ERROR]', err);
      toast.error(`Translation failed: ${err.message}`, { id: 'translate-toast' });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAddEmojis = async () => {
    if (!timeline || !timeline.segments || isAddingEmojis) return;
    setIsAddingEmojis(true);
    toast.loading('AI is attaching viral emojis to your captions...', { id: 'emoji-toast' });
    try {
      const activeId = projectId || timeline.projectId || 'temp';
      const res = await autoAddEmojisToTimeline(activeId, timeline);
      const newTimeline = res?.data?.timeline || res?.data?.data?.timeline;

      if (newTimeline && Array.isArray(newTimeline.segments)) {
        setTimeline(newTimeline);
        toast.success('Viral emojis attached to your captions!', { id: 'emoji-toast' });
        return;
      }
    } catch (err) {
      console.warn('[EMOJI API FALLBACK]', err);
    }

    // Instant Client-Side Emoji Attacher
    const { updatedSegments, appliedCount } = attachClientSideEmojis(timeline.segments);
    setTimeline({ ...timeline, segments: updatedSegments });
    toast.success(`Attached viral emojis to ${appliedCount} words!`, { id: 'emoji-toast' });
    setIsAddingEmojis(false);
  };

  const handleGenerateAiHooks = async () => {
    if (!timeline || isGeneratingHooks) return;
    setIsGeneratingHooks(true);
    toast.loading('Gemini AI is analyzing script to generate Top 5 Hook Banners...', { id: 'hook-toast' });
    try {
      const activeId = projectId || timeline.projectId || 'temp';
      const res = await generateHookBannersForProject(activeId, timeline);
      if (res && res.data && (res.data.suggestions || res.data.topBanner)) {
        const suggestions = res.data.suggestions || [];
        const newBanner = res.data.topBanner || {
          enabled: true,
          text: suggestions[0] || 'VIRAL REELS SECRET 🚨',
          backgroundColor: '#FFE600',
          textColor: '#000000',
          fontFamily: 'Montserrat',
        };
        setTimeline({
          ...timeline,
          topBanner: newBanner,
          topBannerSuggestions: suggestions,
        });
        toast.success('Generated Top 5 Gemini AI Hook Banners!', { id: 'hook-toast' });
      }
    } catch (err) {
      console.error('[HOOK GENERATOR ERROR]', err);
      toast.error(`Hook generation failed: ${err.message}`, { id: 'hook-toast' });
    } finally {
      setIsGeneratingHooks(false);
    }
  };

  const handleTopBannerChange = (key, value) => {
    const currentBanner = timeline?.topBanner || {
      enabled: false,
      text: 'STOP DOING THIS IN 2026 🚨',
      backgroundColor: '#FFE600',
      textColor: '#000000',
      fontFamily: 'Montserrat',
    };
    const updatedBanner = { ...currentBanner, [key]: value };
    setTimeline({ ...timeline, topBanner: updatedBanner });
  };

  // Active segment detection for auto-scroll escalator
  const activeSegment = useMemo(() => {
    if (!timeline?.segments) return null;
    return timeline.segments.find((seg) => currentTime >= (seg.start - 0.05) && currentTime <= (seg.end + 0.05));
  }, [timeline, currentTime]);

  // Escalator Teleprompter Auto-Scroll Effect
  useEffect(() => {
    if (!activeSegment || isStudioCollapsed) return;

    const container = containerRef.current;
    const activeEl = itemRefs.current[activeSegment.id];

    if (container && activeEl) {
      const containerHeight = container.clientHeight;
      const cardTop = activeEl.offsetTop;
      const cardHeight = activeEl.offsetHeight;

      // Keep the active yellow card smoothly centered in view window like an escalator
      const targetScroll = cardTop - (containerHeight / 2) + (cardHeight / 2);

      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }
  }, [activeSegment?.id, isStudioCollapsed]);

  // Safe handlers when timeline is loaded below

  const handleWordChange = (segmentId, wordId, newWord) => {
    const updatedSegments = timeline.segments.map((seg) => {
      if (seg.id !== segmentId) return seg;
      return {
        ...seg,
        words: seg.words.map((w) => (w.id === wordId ? { ...w, word: newWord } : w)),
      };
    });
    setTimeline({ ...timeline, segments: updatedSegments });
  };

  const handleSegmentPropChange = (segmentId, key, value) => {
    const updatedSegments = timeline.segments.map((seg) => {
      if (seg.id !== segmentId) return seg;

      if (key === 'styleOverride') {
        return { ...seg, styleOverride: value };
      } else if (key === 'animation') {
        return { ...seg, animation: value };
      } else if (key === 'fontFamily' || key === 'fontSize') {
        return {
          ...seg,
          fontStyle: {
            ...(seg.fontStyle || {}),
            [key]: value,
          },
        };
      } else if (key === 'positionY') {
        return {
          ...seg,
          position: {
            ...(seg.position || { x: 50, y: 75 }),
            y: value,
          },
        };
      } else if (key === 'maxWordsPerLine') {
        return {
          ...seg,
          maxWordsPerLine: value,
        };
      }
      return seg;
    });
    setTimeline({ ...timeline, segments: updatedSegments });
  };

  const handleWordColorChange = (segmentId, wordId, colorHex) => {
    const updatedSegments = timeline.segments.map((seg) => {
      if (seg.id !== segmentId) return seg;
      return {
        ...seg,
        words: seg.words.map((w) =>
          w.id === wordId ? { ...w, highlightColor: colorHex, isHighlighted: true } : w
        ),
      };
    });
    setTimeline({ ...timeline, segments: updatedSegments });
  };

  const handleEmojiToggle = (segmentId, wordId, emoji) => {
    const updatedSegments = timeline.segments.map((seg) => {
      if (seg.id !== segmentId) return seg;
      return {
        ...seg,
        words: seg.words.map((w) =>
          w.id === wordId ? { ...w, emoji: w.emoji === emoji ? null : emoji } : w
        ),
      };
    });
    setTimeline({ ...timeline, segments: updatedSegments });
  };

  // Instant 1-Click Silence Snapper
  const handleSnapSilenceGap = (currentSegId, nextSegId) => {
    const currentIdx = timeline.segments.findIndex((s) => s.id === currentSegId);
    const nextIdx = timeline.segments.findIndex((s) => s.id === nextSegId);
    if (currentIdx === -1 || nextIdx === -1) return;

    const currentEnd = timeline.segments[currentIdx].end;
    const updatedSegments = [...timeline.segments];
    updatedSegments[nextIdx] = {
      ...updatedSegments[nextIdx],
      start: currentEnd,
    };
    setTimeline({ ...timeline, segments: updatedSegments });
  };

  // Broadcast-grade production Ripple Shift & Timestamp Editor
  const handleTimeChange = (segmentId, field, valStr) => {
    const num = parseFloat(valStr);
    if (isNaN(num)) return;

    let segmentsCopy = timeline.segments.map((seg) => ({
      ...seg,
      words: Array.isArray(seg.words) ? seg.words.map((w) => ({ ...w })) : [],
    }));
    const targetIdx = segmentsCopy.findIndex((s) => s.id === segmentId);
    if (targetIdx === -1) return;

    const target = segmentsCopy[targetIdx];
    const oldStart = target.start;
    const oldEnd = target.end;

    if (field === 'end') {
      const newEnd = Math.max(target.start + 0.05, Math.round(num * 100) / 100);
      const delta = Math.round((newEnd - oldEnd) * 100) / 100;

      // Scale word timestamps within the target segment proportionally
      if (Array.isArray(target.words) && target.words.length > 0) {
        const oldDur = Math.max(0.1, oldEnd - target.start);
        const newDur = Math.max(0.1, newEnd - target.start);
        const scale = newDur / oldDur;

        target.words = target.words.map((w) => {
          const relStart = w.start - target.start;
          const relEnd = w.end - target.start;
          return {
            ...w,
            start: Math.round((target.start + relStart * scale) * 100) / 100,
            end: Math.round((target.start + relEnd * scale) * 100) / 100,
          };
        });
      }
      target.end = newEnd;

      // Ripple shift subsequent segments if ripple is enabled
      if (rippleEnabled && delta !== 0) {
        for (let i = targetIdx + 1; i < segmentsCopy.length; i++) {
          const seg = segmentsCopy[i];
          const segStart = Math.max(0, Math.round((seg.start + delta) * 100) / 100);
          const segEnd = Math.max(segStart + 0.05, Math.round((seg.end + delta) * 100) / 100);
          seg.start = segStart;
          seg.end = segEnd;

          if (Array.isArray(seg.words)) {
            seg.words = seg.words.map((w) => ({
              ...w,
              start: Math.max(0, Math.round((w.start + delta) * 100) / 100),
              end: Math.max(0.05, Math.round((w.end + delta) * 100) / 100),
            }));
          }
        }
      }
    } else if (field === 'start') {
      const prevEnd = targetIdx > 0 ? segmentsCopy[targetIdx - 1].end : 0;
      const newStart = Math.max(prevEnd, Math.max(0, Math.round(num * 100) / 100));
      const delta = Math.round((newStart - oldStart) * 100) / 100;

      if (rippleEnabled && delta !== 0) {
        // Shift target start & end maintaining duration
        target.start = newStart;
        target.end = Math.max(newStart + 0.05, Math.round((oldEnd + delta) * 100) / 100);
        if (Array.isArray(target.words)) {
          target.words = target.words.map((w) => ({
            ...w,
            start: Math.max(newStart, Math.round((w.start + delta) * 100) / 100),
            end: Math.max(newStart + 0.05, Math.round((w.end + delta) * 100) / 100),
          }));
        }

        // Shift subsequent segments
        for (let i = targetIdx + 1; i < segmentsCopy.length; i++) {
          const seg = segmentsCopy[i];
          const segStart = Math.max(0, Math.round((seg.start + delta) * 100) / 100);
          const segEnd = Math.max(segStart + 0.05, Math.round((seg.end + delta) * 100) / 100);
          seg.start = segStart;
          seg.end = segEnd;

          if (Array.isArray(seg.words)) {
            seg.words = seg.words.map((w) => ({
              ...w,
              start: Math.max(0, Math.round((w.start + delta) * 100) / 100),
              end: Math.max(0.05, Math.round((w.end + delta) * 100) / 100),
            }));
          }
        }
      } else {
        // Non-ripple start change: scale words to fit [newStart, end]
        let fitEnd = target.end;
        if (newStart >= fitEnd) fitEnd = Math.round((newStart + 0.3) * 100) / 100;

        if (Array.isArray(target.words) && target.words.length > 0) {
          const oldDur = Math.max(0.1, target.end - oldStart);
          const newDur = Math.max(0.1, fitEnd - newStart);
          const scale = newDur / oldDur;

          target.words = target.words.map((w) => {
            const relStart = w.start - oldStart;
            const relEnd = w.end - oldStart;
            return {
              ...w,
              start: Math.round((newStart + relStart * scale) * 100) / 100,
              end: Math.round((newStart + relEnd * scale) * 100) / 100,
            };
          });
        }
        target.start = newStart;
        target.end = fitEnd;
      }
    }

    setTimeline({ ...timeline, segments: segmentsCopy });
  };

  // 1-Click Nudge Segment & Downstream Timeline Shift
  const handleNudgeSegment = (segmentId, offsetSeconds) => {
    let segmentsCopy = timeline.segments.map((seg) => ({
      ...seg,
      words: Array.isArray(seg.words) ? seg.words.map((w) => ({ ...w })) : [],
    }));
    const targetIdx = segmentsCopy.findIndex((s) => s.id === segmentId);
    if (targetIdx === -1) return;

    const startIdx = rippleEnabled ? targetIdx : targetIdx;
    const endIdx = rippleEnabled ? segmentsCopy.length - 1 : targetIdx;

    for (let i = startIdx; i <= endIdx; i++) {
      const seg = segmentsCopy[i];
      const prevEnd = i > 0 ? segmentsCopy[i - 1].end : 0;
      const rawStart = Math.round((seg.start + offsetSeconds) * 100) / 100;
      const segStart = Math.max(i === targetIdx && !rippleEnabled ? prevEnd : 0, Math.max(0, rawStart));
      const segEnd = Math.max(segStart + 0.05, Math.round((seg.end + offsetSeconds) * 100) / 100);

      seg.start = segStart;
      seg.end = segEnd;

      if (Array.isArray(seg.words)) {
        seg.words = seg.words.map((w) => ({
          ...w,
          start: Math.max(0, Math.round((w.start + offsetSeconds) * 100) / 100),
          end: Math.max(0.05, Math.round((w.end + offsetSeconds) * 100) / 100),
        }));
      }
    }

    setTimeline({ ...timeline, segments: segmentsCopy });
  };

  // Global Time Shift / Delay Offset Tool
  const handleApplyGlobalShift = (fromSelectedOnly = false) => {
    const offset = parseFloat(globalShiftInput);
    if (isNaN(offset) || offset === 0) return;

    let segmentsCopy = timeline.segments.map((seg) => ({
      ...seg,
      words: Array.isArray(seg.words) ? seg.words.map((w) => ({ ...w })) : [],
    }));

    let startIdx = 0;
    if (fromSelectedOnly && selectedSegId) {
      const foundIdx = segmentsCopy.findIndex((s) => s.id === selectedSegId);
      if (foundIdx !== -1) startIdx = foundIdx;
    }

    for (let i = startIdx; i < segmentsCopy.length; i++) {
      const seg = segmentsCopy[i];
      const segStart = Math.max(0, Math.round((seg.start + offset) * 100) / 100);
      const segEnd = Math.max(segStart + 0.05, Math.round((seg.end + offset) * 100) / 100);
      seg.start = segStart;
      seg.end = segEnd;

      if (Array.isArray(seg.words)) {
        seg.words = seg.words.map((w) => ({
          ...w,
          start: Math.max(0, Math.round((w.start + offset) * 100) / 100),
          end: Math.max(0.05, Math.round((w.end + offset) * 100) / 100),
        }));
      }
    }

    setTimeline({ ...timeline, segments: segmentsCopy });
    setGlobalShiftInput('0.00');
    setShowGlobalShift(false);
  };


  const handleSplitSegment = (segmentId) => {
    const targetIdx = timeline.segments.findIndex((s) => s.id === segmentId);
    if (targetIdx === -1) return;
    const target = timeline.segments[targetIdx];
    if (!target.words || target.words.length <= 1) return;

    let splitWordIdx = target.words.findIndex((w) => w.start >= currentTime);
    if (splitWordIdx <= 0 || splitWordIdx >= target.words.length) {
      splitWordIdx = Math.floor(target.words.length / 2);
    }

    const firstWords = target.words.slice(0, splitWordIdx);
    const secondWords = target.words.slice(splitWordIdx);

    const firstSeg = {
      ...target,
      id: `${target.id}_a_${Date.now()}`,
      end: firstWords[firstWords.length - 1].end,
      words: firstWords,
    };

    const secondSeg = {
      ...target,
      id: `${target.id}_b_${Date.now()}`,
      start: secondWords[0].start,
      words: secondWords,
    };

    const newSegments = [
      ...timeline.segments.slice(0, targetIdx),
      firstSeg,
      secondSeg,
      ...timeline.segments.slice(targetIdx + 1),
    ];

    setTimeline({ ...timeline, segments: newSegments });
  };

  const handleMergeNextSegment = (segmentId) => {
    const targetIdx = timeline.segments.findIndex((s) => s.id === segmentId);
    if (targetIdx === -1 || targetIdx >= timeline.segments.length - 1) return;

    const curr = timeline.segments[targetIdx];
    const next = timeline.segments[targetIdx + 1];

    const mergedWords = [...(curr.words || []), ...(next.words || [])].sort((a, b) => a.start - b.start);

    const mergedSeg = {
      ...curr,
      id: `${curr.id}_merged_${Date.now()}`,
      end: next.end,
      words: mergedWords,
    };

    const newSegments = [
      ...timeline.segments.slice(0, targetIdx),
      mergedSeg,
      ...timeline.segments.slice(targetIdx + 2),
    ];

    setTimeline({ ...timeline, segments: newSegments });
  };

  const handleAutoFixGaps = () => {
    if (!timeline || !timeline.segments) return;
    let fixedCount = 0;
    const repairedSegments = timeline.segments.map((seg, sIdx) => {
      const words = seg.words || [];
      const repairedWords = words.map((w, idx) => {
        if (idx === 0) return w;
        const prev = words[idx - 1];
        const gap = w.start - prev.end;
        if (gap > 0 && gap <= 0.45) {
          fixedCount++;
          return { ...w, start: prev.end };
        }
        return w;
      });

      const nextSeg = timeline.segments[sIdx + 1];
      let segEnd = seg.end;
      if (nextSeg && (nextSeg.start - seg.end > 0) && (nextSeg.start - seg.end <= 0.65)) {
        segEnd = nextSeg.start;
        fixedCount++;
      }

      return { ...seg, end: segEnd, words: repairedWords };
    });

    setTimeline({ ...timeline, segments: repairedSegments });
    setGapsFixed(true);
    toast.success(
      fixedCount > 0
        ? `Auto-fixed ${fixedCount} micro gaps between captions!`
        : 'All caption gaps are already 100% seamless!',
      { id: 'autofix-toast' }
    );
  };

  const handleQuickPresetSelect = (presetId) => {
    const updatedTheme = {
      ...(timeline.globalTheme || {}),
      presetName: presetId,
    };
    setTimeline({ ...timeline, globalTheme: updatedTheme });
    toast.success(`Applied ${presetId.replace('_', ' ').toUpperCase()} preset theme!`, { id: 'preset-quick-toast', duration: 1500 });
  };

  if (!timeline || !Array.isArray(timeline.segments) || timeline.segments.length === 0) {
    return (
      <div className="w-full bg-white/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 min-h-[320px] shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex items-center justify-center">
          <Sparkles className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Subtitles & Kinetic Reel Studio</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed">
            Add custom animated subtitles, word-level kinetic captions, or AI hooks to your video.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const initialTimeline = {
              version: '1.0',
              aspectRatio: '9:16',
              tracks: [{ id: 'track-video-1', type: 'video', clips: [] }],
              segments: [
                {
                  id: `seg_${Date.now()}`,
                  start: 0,
                  end: 5.0,
                  text: 'Add your AI caption text here',
                  words: [
                    { id: `w1_${Date.now()}`, start: 0, end: 2.5, word: 'Add' },
                    { id: `w2_${Date.now()}`, start: 2.5, end: 5.0, word: 'Captions' }
                  ],
                  fontStyle: { preset: 'HORMOZI', fontSize: 52, primaryColor: '#FFFFFF', highlightColor: '#FACC15' }
                }
              ],
              globalTheme: { preset: 'HORMOZI', fontFamily: 'Inter', fontSize: 52, primaryColor: '#FFFFFF', highlightColor: '#FACC15' }
            };
            setTimeline(initialTimeline);
            toast.success('Kinetic Subtitle Track initialized! Edit your captions below.');
          }}
          className="px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-yellow-500/20 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Kinetic Captions & Subtitle Track</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-5 space-y-4 max-h-[85vh] flex flex-col transition-colors overflow-x-hidden">
      <div className="w-full pb-3 border-b border-slate-200 dark:border-zinc-800 flex flex-col gap-2.5">
        {/* Friendly Header Title & Collapse Toggle */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div
            onClick={() => setIsStudioCollapsed(!isStudioCollapsed)}
            className="flex items-center gap-2 cursor-pointer select-none group hover:opacity-80 transition"
            title="Click to toggle Subtitle Editor view"
          >
            <Edit3 className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
              ✏️ Subtitles & Timing
            </h3>
            <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-yellow-500/20">
              ✨ AI Auto-Synced
            </span>
          </div>

          {/* Quick Audition Preset Pills */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5 max-w-[280px] sm:max-w-none">
            {[
              { id: THEME_PRESETS.HORMOZI, label: '🔥 Hormozi' },
              { id: THEME_PRESETS.SUBMAGIC_GLOW, label: '⚡ Submagic' },
              { id: THEME_PRESETS.GOLD_LUXURY, label: '🌟 Gold' },
              { id: THEME_PRESETS.MRBEAST_PUNCH, label: '💥 MrBeast' },
              { id: THEME_PRESETS.NEON_LEMON, label: '🎨 Neon' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickPresetSelect(p.id);
                }}
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap transition-all border cursor-pointer ${
                  timeline.globalTheme?.presetName === p.id
                    ? 'bg-yellow-500 text-black border-yellow-400 font-black shadow-sm'
                    : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-yellow-500/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span
              onClick={() => setIsStudioCollapsed(!isStudioCollapsed)}
              className="text-xs text-slate-500 dark:text-zinc-400 font-mono cursor-pointer select-none"
            >
              {timeline.segments.length} Subtitle Cards
            </span>
            <button
              type="button"
              onClick={() => setIsStudioCollapsed(!isStudioCollapsed)}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              {isStudioCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Row 2: Tool Action Controls (Clean Responsive Flex Wrap Format) */}
        {!isStudioCollapsed && (
          <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap w-full">
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              {/* Ripple Sync Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRippleEnabled(!rippleEnabled);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  rippleEnabled
                    ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/30 dark:hover:bg-yellow-500/30 shadow-sm shadow-yellow-500/10'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-300 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
                title={
                  rippleEnabled
                    ? 'Auto-Shift ON: Changing any time frame automatically shifts all downstream captions'
                    : 'Auto-Shift OFF: Edit time frames independently without moving downstream captions'
                }
              >
                <Zap className={`w-3.5 h-3.5 ${rippleEnabled ? 'text-yellow-500 animate-pulse' : 'text-slate-400'}`} />
                <span>Auto-Shift {rippleEnabled ? 'ON' : 'OFF'}</span>
              </button>

              {/* 1-Click Auto-Fix Gaps Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAutoFixGaps();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  gapsFixed
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
                title="Fix Micro Gaps: Keeps captions flowing smoothly without flicker"
              >
                <Sparkles className={`w-3.5 h-3.5 fill-current ${gapsFixed ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span>Fix Gaps</span>
              </button>

              {/* Global Offset Tool Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGlobalShift(!showGlobalShift);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  showGlobalShift
                    ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
                title="Delay or shift subtitle timing forward/backward"
              >
                <SlidersHorizontal className={`w-3.5 h-3.5 ${showGlobalShift ? 'text-cyan-500' : 'text-slate-400'}`} />
                <span>Delay/Shift</span>
              </button>

              {/* 1-Click AI Viral Emojis Button */}
              <div className="relative flex items-center gap-2" ref={translateMenuRef}>
                <button
                  type="button"
                  disabled={isAddingEmojis || isTranslating}
                  onClick={handleAddEmojis}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer disabled:opacity-50 ${
                    hasEmojis || isAddingEmojis
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/10'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                  title="Attach top-tier viral emojis to key words in your captions"
                >
                  {isAddingEmojis ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" /> : <Sparkles className={`w-3.5 h-3.5 ${hasEmojis ? 'text-amber-500' : 'text-slate-400'}`} />}
                  <span>{isAddingEmojis ? 'Adding...' : '✨ Add Emojis'}</span>
                </button>

                <button
                  type="button"
                  disabled={isTranslating}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTranslateMenu(!showTranslateMenu);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer disabled:opacity-50 ${
                    showTranslateMenu || isTranslating
                      ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                  title="1-Click AI Translation: Translate captions to English, Telugu, Hindi, or Spanish in 2 seconds while preserving word timing"
                >
                  {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" /> : <Languages className={`w-3.5 h-3.5 ${showTranslateMenu || isTranslating ? 'text-indigo-500' : 'text-slate-400'}`} />}
                  <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
                  <ChevronDown className="w-3 h-3 text-indigo-400" />
                </button>

                {showTranslateMenu && (
                  <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                    <button
                      type="button"
                      onClick={() => handleTranslate('english')}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                    >
                      <span>🇬🇧</span> Pure English
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTranslate('telugu')}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                    >
                      <span>🇮🇳</span> Native Telugu (తెలుగు)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTranslate('hindi')}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                    >
                      <span>🇮🇳</span> Native Hindi (हिंदी)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTranslate('tel_eng')}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                    >
                      <span>⚡</span> Tanglish (Telugu + Eng)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTranslate('hin_eng')}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                    >
                      <span>⚡</span> Hinglish (Hindi + Eng)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTranslate('hin_tel')}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                    >
                      <span>🌶️</span> Hin + Tel (Hindi + Telugu)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTranslate('chatting')}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                    >
                      <span>💬</span> Spoken Chat (Roman)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTranslate('genz')}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                    >
                      <span>🔥</span> Gen-Z Viral Slang
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTranslate('dramatic')}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                    >
                      <span>🎬</span> Dramatic Cinema
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTranslate('punchy')}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                    >
                      <span>⚡</span> Short & Punchy (High CTR)
                    </button>
                  </div>
                )}

                {/* Top Viral Hook Banner Toggle Button right side of Translate button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextShow = !showTopBannerMenu;
                    setShowTopBannerMenu(nextShow);
                    
                    if (nextShow && !timeline?.topBanner?.enabled) {
                      handleTopBannerChange('enabled', true);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    timeline?.topBanner?.enabled || showTopBannerMenu
                      ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/40 shadow-sm shadow-purple-500/10'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                  title="Top Viral Hook Banner Overlay"
                >
                  <Tag className="w-3.5 h-3.5 text-purple-500" />
                  <span>Hook Banner {timeline?.topBanner?.enabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* Undo / Redo buttons */}
            {onUndo && onRedo && (
              <div
                className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/90 p-1 rounded-xl border border-slate-200 dark:border-zinc-700/80"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
                  title="Undo timeline edit (Ctrl+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>
                <button
                  type="button"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
                  title="Redo timeline edit (Ctrl+Y)"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                  <span>Redo</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Global Offset Delay Panel */}
        {showGlobalShift && (
          <div ref={globalShiftRef} className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between gap-3 text-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-600 dark:text-cyan-400">Shift Timeline Offset:</span>
              <input
                type="number"
                step="0.05"
                value={globalShiftInput}
                onChange={(e) => setGlobalShiftInput(e.target.value)}
                className="w-20 bg-white dark:bg-zinc-900 border border-cyan-500/40 rounded px-2 py-0.5 text-center font-mono font-bold text-cyan-600 dark:text-cyan-400 outline-none"
                placeholder="+0.50"
              />
              <span className="text-slate-500 dark:text-zinc-400 text-[11px]">sec</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleApplyGlobalShift(false)}
                className="px-2.5 py-1 rounded bg-cyan-500 text-black font-bold text-[11px] hover:bg-cyan-400 transition"
              >
                Shift All Captions
              </button>
              {selectedSegId && (
                <button
                  type="button"
                  onClick={() => handleApplyGlobalShift(true)}
                  className="px-2.5 py-1 rounded bg-slate-800 text-cyan-400 font-bold text-[11px] hover:bg-slate-700 transition"
                >
                  Shift From Selected
                </button>
              )}
            </div>
          </div>
        )}

        {/* Top Viral Hook Banner AI & Customization Control Panel */}
        {(showTopBannerMenu || timeline?.topBanner?.enabled) && (
          <div ref={hookBannerRef} className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-3 text-xs animate-fadeIn">
            {/* Top Row: AI Generator & Live Title Editing Input */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <Tag className="w-4 h-4 text-purple-500 shrink-0" />
                <span className="font-bold text-purple-600 dark:text-purple-400 shrink-0">Hook Banner Text:</span>
                <input
                  type="text"
                  value={timeline?.topBanner?.text || ''}
                  onChange={(e) => handleTopBannerChange('text', e.target.value)}
                  className="flex-1 bg-white dark:bg-zinc-900 border border-purple-500/40 rounded-xl px-3 py-1.5 font-extrabold text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="STOP DOING THIS IN 2026 🚨"
                />
              </div>

              {/* Gemini AI Re-Generate Button & Close X Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTopBannerChange('enabled', !timeline?.topBanner?.enabled)}
                  className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] transition border cursor-pointer ${
                    timeline?.topBanner?.enabled
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                  title="Toggle Canvas Overlay"
                >
                  {timeline?.topBanner?.enabled ? 'OVERLAY ON' : 'OVERLAY OFF'}
                </button>

                <button
                  type="button"
                  disabled={isGeneratingHooks}
                  onClick={handleGenerateAiHooks}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Gemini AI will analyze your video speech and generate 5 top-converting viral hook headlines"
                >
                  {isGeneratingHooks ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isGeneratingHooks ? 'Generating...' : '✨ Generate Top 5 AI Hooks'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTopBannerMenu(false)}
                  className="p-1.5 text-purple-600 dark:text-purple-400 hover:text-slate-900 dark:hover:text-white hover:bg-purple-500/20 rounded-xl transition cursor-pointer"
                  title="Close Hook Banner Panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Top 5 Gemini AI Generated Hook Suggestions (Click to Apply 1-Click) */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-purple-500/20">
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Top 5 AI Hooks:
              </span>
              {(timeline.topBannerSuggestions || [
                'STOP DOING THIS IN 2026 🚨',
                'VIRAL REELS SECRET ⚡',
                'UNBELIEVABLE TRUTH 🚀',
                'DO THIS IMMEDIATELY 🔥',
                'DONT MISS THIS TIP 💡',
              ]).map((hook, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTopBannerChange('text', hook)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition border cursor-pointer ${
                    (timeline.topBanner?.text || '').trim().toUpperCase() === hook.trim().toUpperCase()
                      ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                      : 'bg-white dark:bg-zinc-900 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
                  }`}
                  title={`Apply "${hook}"`}
                >
                  {hook}
                </button>
              ))}
            </div>

            {/* Color Pickers (Bg Color & Text Color) */}
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-purple-500/20 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-600 dark:text-purple-400 text-[11px]">Bg Color:</span>
                {['#FFE600', '#EF4444', '#06B6D4', '#84CC16', '#D946EF', '#F59E0B', '#FFFFFF', '#000000'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleTopBannerChange('backgroundColor', c)}
                    className={`w-4.5 h-4.5 rounded-full border transition cursor-pointer ${
                      (timeline.topBanner?.backgroundColor || '#FFE600') === c ? 'scale-125 border-purple-500 ring-2 ring-purple-500/50' : 'border-slate-300 dark:border-zinc-700'
                    }`}
                    style={{ backgroundColor: c }}
                    title={`Set background ${c}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-600 dark:text-purple-400 text-[11px]">Text Color:</span>
                {['#000000', '#FFFFFF', '#FFE600', '#EF4444'].map((tc) => (
                  <button
                    key={tc}
                    type="button"
                    onClick={() => handleTopBannerChange('textColor', tc)}
                    className={`w-4.5 h-4.5 rounded-full border transition cursor-pointer ${
                      (timeline.topBanner?.textColor || '#000000') === tc ? 'scale-125 border-purple-500 ring-2 ring-purple-500/50' : 'border-slate-300 dark:border-zinc-700'
                    }`}
                    style={{ backgroundColor: tc }}
                    title={`Set text color ${tc}`}
                  />
                ))}
              </div>
            </div>

            {/* Vertically Stacked Typography, Full-Width Size & Y-Pos Sliders & Alignment Controls */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-purple-500/20 text-[11px]">
              {/* Row 1: Font Family & Align Buttons */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <span className="font-bold text-purple-600 dark:text-purple-400 shrink-0">Font:</span>
                  <select
                    value={timeline.topBanner?.fontFamily || 'Montserrat'}
                    onChange={(e) => handleTopBannerChange('fontFamily', e.target.value)}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-purple-500/30 rounded-lg px-2.5 py-1 font-bold text-slate-800 dark:text-zinc-200 text-xs outline-none cursor-pointer"
                  >
                    <option value="Montserrat">Montserrat (Bold)</option>
                    <option value="Impact">Impact (Heavy)</option>
                    <option value="Outfit">Outfit (Modern)</option>
                    <option value="Bebas Neue">Bebas Neue (Condensed)</option>
                    <option value="Inter">Inter (Clean)</option>
                    <option value="Cinzel">Cinzel (Cinematic)</option>
                    <option value="Noto Sans Telugu">Noto Sans Telugu</option>
                  </select>
                </div>

                {/* Alignment Buttons: Left / Center / Right */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-purple-500/30">
                  <span className="font-bold text-purple-600 dark:text-purple-400 text-[10px] px-1">Align:</span>
                  {['left', 'center', 'right'].map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => handleTopBannerChange('textAlign', align)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold capitalize transition cursor-pointer ${
                        (timeline.topBanner?.textAlign || 'center') === align
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Full-Width Font Size Slider with Dynamic Floating Cursor Tooltip (Mobile Touch + Desktop Mouse) */}
              <div className="flex items-center gap-2.5 w-full pt-4">
                <span className="font-bold text-purple-600 dark:text-purple-400 shrink-0 w-10">Size:</span>
                <div
                  className="relative flex-1 flex items-center group cursor-pointer touch-none"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const rawVal = 24 + pct * (72 - 24);
                    const steppedVal = Math.round(rawVal / 2) * 2;
                    setHoverSizeVal(Math.max(24, Math.min(72, steppedVal)));
                  }}
                  onMouseLeave={() => setHoverSizeVal(null)}
                  onTouchStart={(e) => {
                    if (e.touches && e.touches[0]) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
                      const rawVal = 24 + pct * (72 - 24);
                      const steppedVal = Math.round(rawVal / 2) * 2;
                      setHoverSizeVal(Math.max(24, Math.min(72, steppedVal)));
                    }
                  }}
                  onTouchMove={(e) => {
                    if (e.touches && e.touches[0]) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
                      const rawVal = 24 + pct * (72 - 24);
                      const steppedVal = Math.round(rawVal / 2) * 2;
                      setHoverSizeVal(Math.max(24, Math.min(72, steppedVal)));
                    }
                  }}
                  onTouchEnd={() => setHoverSizeVal(null)}
                >
                  {/* Floating Dynamic Tooltip Badge following cursor mouse hover / touch position */}
                  <div
                    className="absolute -top-6 transform -translate-x-1/2 px-2 py-0.5 rounded-md bg-purple-600 text-white font-mono font-extrabold text-[10px] shadow-lg pointer-events-none transition-all duration-75 z-20 flex items-center justify-center after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-purple-600"
                    style={{
                      left: `clamp(16px, ${Math.round((((hoverSizeVal !== null ? hoverSizeVal : (timeline.topBanner?.fontSize || 48)) - 24) / (72 - 24)) * 100)}%, calc(100% - 16px))`,
                    }}
                  >
                    {hoverSizeVal !== null ? hoverSizeVal : (timeline.topBanner?.fontSize || 48)}px
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="72"
                    step="2"
                    value={timeline.topBanner?.fontSize || 48}
                    onChange={(e) => handleTopBannerChange('fontSize', parseInt(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
                <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400 w-10 text-right shrink-0">
                  {timeline.topBanner?.fontSize || 48}px
                </span>
              </div>

              {/* Row 3: Full-Width Vertical Position (Y-Pos) Slider with Dynamic Floating Cursor Tooltip (Mobile Touch + Desktop Mouse) */}
              <div className="flex items-center gap-2.5 w-full pt-4">
                <span className="font-bold text-purple-600 dark:text-purple-400 shrink-0 w-10">Y-Pos:</span>
                <div
                  className="relative flex-1 flex items-center group cursor-pointer touch-none"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const rawVal = 5 + pct * (80 - 5);
                    const steppedVal = Math.round(rawVal);
                    setHoverYVal(Math.max(5, Math.min(80, steppedVal)));
                  }}
                  onMouseLeave={() => setHoverYVal(null)}
                  onTouchStart={(e) => {
                    if (e.touches && e.touches[0]) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
                      const rawVal = 5 + pct * (80 - 5);
                      const steppedVal = Math.round(rawVal);
                      setHoverYVal(Math.max(5, Math.min(80, steppedVal)));
                    }
                  }}
                  onTouchMove={(e) => {
                    if (e.touches && e.touches[0]) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
                      const rawVal = 5 + pct * (80 - 5);
                      const steppedVal = Math.round(rawVal);
                      setHoverYVal(Math.max(5, Math.min(80, steppedVal)));
                    }
                  }}
                  onTouchEnd={() => setHoverYVal(null)}
                >
                  {/* Floating Dynamic Tooltip Badge following cursor mouse hover / touch position */}
                  <div
                    className="absolute -top-6 transform -translate-x-1/2 px-2 py-0.5 rounded-md bg-purple-600 text-white font-mono font-extrabold text-[10px] shadow-lg pointer-events-none transition-all duration-75 z-20 flex items-center justify-center after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-purple-600"
                    style={{
                      left: `clamp(16px, ${Math.round((((hoverYVal !== null ? hoverYVal : (typeof timeline.topBanner?.positionY === 'number' ? timeline.topBanner.positionY : 12)) - 5) / (80 - 5)) * 100)}%, calc(100% - 16px))`,
                    }}
                  >
                    {hoverYVal !== null ? hoverYVal : (typeof timeline.topBanner?.positionY === 'number' ? timeline.topBanner.positionY : 12)}%
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    step="1"
                    value={typeof timeline.topBanner?.positionY === 'number' ? timeline.topBanner.positionY : 12}
                    onChange={(e) => handleTopBannerChange('positionY', parseInt(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
                <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400 w-10 text-right shrink-0">
                  {typeof timeline.topBanner?.positionY === 'number' ? timeline.topBanner.positionY : 12}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isStudioCollapsed && (
        <div ref={containerRef} className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar animate-fadeIn">
          {/* Friendly Guidance Tip Banner for First-Time Users */}
          <div className="bg-yellow-500/10 dark:bg-yellow-500/15 border border-yellow-500/30 rounded-xl px-3 py-2 text-xs font-semibold text-amber-800 dark:text-yellow-300 flex items-center justify-between gap-2 shadow-2xs">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
              <span>💡 <b>Quick Tip:</b> Tap any word below to change text, colors, or timing!</span>
            </span>
            <span className="text-[10px] bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 font-extrabold px-1.5 py-0.5 rounded shrink-0">
              1-TAP EDIT
            </span>
          </div>

          {timeline.segments.map((segment, segIdx) => {
            const isActive = currentTime >= segment.start && currentTime <= segment.end;
            const isExpanded = expandedSegId === segment.id;
            const isSelected = selectedSegId === segment.id;

            return (
              <React.Fragment key={segment.id || segIdx}>
                <div
                  ref={(el) => {
                    if (el) itemRefs.current[segment.id] = el;
                  }}
                  onClick={() => {
                    setCurrentTime(segment.start);
                    setSelectedSegId(segment.id);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-default shadow-sm space-y-3 ${
                    isActive
                      ? 'border-yellow-500/80 dark:border-yellow-400/80 bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent dark:from-yellow-400/10 dark:via-yellow-400/5 dark:to-transparent shadow-lg shadow-yellow-500/10 ring-2 ring-yellow-500/20'
                      : 'border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/90 hover:border-slate-300 dark:hover:border-zinc-700/90 shadow-sm'
                  }`}
                >
                  {/* 1. Card Top Header: Timestamp Badge & Quick Actions */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                    {/* Prominent Timestamp Badge with Clear Bold Digits */}
                    <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-black text-slate-800 dark:text-zinc-100 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-2 py-1 shadow-sm shrink-0">
                      <Clock className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400 shrink-0" />
                      
                      {/* Start Time Stepper Control: [-] 22.63 [+] */}
                      <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700/80 focus-within:border-yellow-500 rounded-lg p-0.5 shadow-inner shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTimeChange(segment.id, 'start', Math.max(0, parseFloat(segment.start || 0) - 0.05).toFixed(2))}
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-yellow-500 hover:text-black dark:hover:bg-yellow-400 dark:hover:text-black border border-slate-200 dark:border-zinc-700/60 transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90"
                          title="Nudge backward -0.05s"
                        >
                          <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                        </button>

                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={segment.start}
                          onChange={(e) => handleTimeChange(segment.id, 'start', e.target.value)}
                          className="w-11 sm:w-12 bg-transparent text-yellow-600 dark:text-yellow-400 font-black text-center text-xs sm:text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          title="Edit start time"
                        />

                        <button
                          type="button"
                          onClick={() => handleTimeChange(segment.id, 'start', (parseFloat(segment.start || 0) + 0.05).toFixed(2))}
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-yellow-500 hover:text-black dark:hover:bg-yellow-400 dark:hover:text-black border border-slate-200 dark:border-zinc-700/60 transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90"
                          title="Nudge forward +0.05s"
                        >
                          <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                        </button>
                      </div>

                      <span className="text-slate-400 dark:text-zinc-500 text-xs shrink-0">→</span>

                      {/* End Time Stepper Control: [-] 23.01 [+] */}
                      <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700/80 focus-within:border-yellow-500 rounded-lg p-0.5 shadow-inner shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTimeChange(segment.id, 'end', Math.max(0, parseFloat(segment.end || 0) - 0.05).toFixed(2))}
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-yellow-500 hover:text-black dark:hover:bg-yellow-400 dark:hover:text-black border border-slate-200 dark:border-zinc-700/60 transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90"
                          title="Nudge backward -0.05s"
                        >
                          <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                        </button>

                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={segment.end}
                          onChange={(e) => handleTimeChange(segment.id, 'end', e.target.value)}
                          className="w-11 sm:w-12 bg-transparent text-yellow-600 dark:text-yellow-400 font-black text-center text-xs sm:text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          title="Edit end time"
                        />

                        <button
                          type="button"
                          onClick={() => handleTimeChange(segment.id, 'end', (parseFloat(segment.end || 0) + 0.05).toFixed(2))}
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-yellow-500 hover:text-black dark:hover:bg-yellow-400 dark:hover:text-black border border-slate-200 dark:border-zinc-700/60 transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90"
                          title="Nudge forward +0.05s"
                        >
                          <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                        </button>
                      </div>

                      <span className="text-yellow-500 dark:text-yellow-400 font-sans text-xs font-black shrink-0">s</span>
                    </div>

                    {/* Formatted Pro Action Toolbar */}
                    <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSplitSegment(segment.id)}
                        className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-yellow-500 dark:hover:text-yellow-400 hover:border-yellow-500/50 border border-slate-200 dark:border-zinc-800 transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
                        title="Split timeframe"
                      >
                        <Scissors className="w-3.5 h-3.5 text-yellow-500" />
                      </button>

                      {segIdx < timeline.segments.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMergeNextSegment(segment.id)}
                          className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-cyan-500 dark:hover:text-cyan-400 hover:border-cyan-500/50 border border-slate-200 dark:border-zinc-800 transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
                          title="Merge timeframe"
                        >
                          <GitMerge className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedSegId(isExpanded ? null : segment.id)}
                        className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 ${
                          isExpanded
                            ? 'bg-yellow-500 text-black font-black shadow-md shadow-yellow-500/20'
                            : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-yellow-500 dark:hover:text-yellow-400'
                        }`}
                        title="Typography & settings"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 2. Expanded Granular Drawer */}
                  {isExpanded && (
                    <div
                      className="p-4 rounded-2xl bg-slate-100/90 dark:bg-zinc-950/95 border border-slate-200 dark:border-zinc-800 space-y-4 text-xs shadow-xl animate-fadeIn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Drawer Header */}
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-zinc-200 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                          <span>Timeframe Typography & Position Customizer</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">
                          Per-Frame Override
                        </span>
                      </div>

                      {/* Font Dropdown & Font Studio Button (Side-by-Side) */}
                      <div className="grid grid-cols-2 gap-3 items-end">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 block">
                            Font Family (50+ Styles)
                          </label>
                          <CustomFontSelect
                            value={segment.fontStyle?.fontFamily || 'Inter'}
                            onChange={(font) => handleSegmentPropChange(segment.id, 'fontFamily', font)}
                            categories={FONT_CATEGORIES}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveSegmentFontPickerId(segment.id)}
                          className="w-full py-2.5 px-2 rounded-xl bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-amber-500/20 border border-yellow-500/40 text-yellow-600 dark:text-yellow-400 font-extrabold text-[11px] hover:border-yellow-500 hover:bg-yellow-500/30 transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer whitespace-nowrap active:scale-98"
                          title="Browse 70+ Multilingual Fonts Studio"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse shrink-0" />
                          <span className="truncate">Browse 70+ Fonts</span>
                        </button>
                      </div>

                      {/* Full Width Font Size Card */}
                      <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-2 shadow-xs">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                          <span>Font Size</span>
                          <span className="font-mono text-yellow-600 dark:text-yellow-400 font-black">
                            {segment.fontStyle?.fontSize || 52}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="90"
                          value={segment.fontStyle?.fontSize || 52}
                          onChange={(e) => handleSegmentPropChange(segment.id, 'fontSize', parseInt(e.target.value, 10))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 accent-yellow-500 dark:accent-yellow-400 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Full Width Position Y Card */}
                      <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-2 shadow-xs">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                          <span>Vertical Position Y</span>
                          <span className="font-mono text-yellow-600 dark:text-yellow-400 font-black">
                            {segment.position?.y || 75}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="85"
                          value={segment.position?.y || 75}
                          onChange={(e) => handleSegmentPropChange(segment.id, 'positionY', parseInt(e.target.value, 10))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 accent-yellow-500 dark:accent-yellow-400 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Word Pacing Options */}
                      <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-2 shadow-xs">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                          <span>Words Per Line (Timeframe Pacing)</span>
                          <span className="font-mono text-yellow-600 dark:text-yellow-400 font-black">
                            {segment.maxWordsPerLine || timeline.globalTheme?.maxWordsPerLine || 3} words
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 2, 3, 4].map((num) => {
                            const isSelectedOption = (segment.maxWordsPerLine || timeline.globalTheme?.maxWordsPerLine || 3) === num;
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handleSegmentPropChange(segment.id, 'maxWordsPerLine', num)}
                                className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                                  isSelectedOption
                                    ? 'border-yellow-500 bg-yellow-500 text-black shadow-md shadow-yellow-500/20 font-black'
                                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
                                }`}
                              >
                                {num === 1 ? '1 Word' : `${num} Words`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Clean Continuous Transcript Canvas Area */}
                  <div
                    className="p-3 bg-slate-50/80 dark:bg-zinc-950/80 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl flex flex-wrap items-center gap-2.5 min-h-[56px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {segment.words.map((w) => {
                      const isWordActive = isActive && currentTime >= (w.start || segment.start) && currentTime <= (w.end || segment.end);
                      return (
                        <div
                          key={w.id}
                          className={`group relative flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl transition-all cursor-default shadow-2xs ${
                            isWordActive
                              ? 'bg-yellow-500/15 dark:bg-yellow-400/20 border-2 border-yellow-500/80 dark:border-yellow-400/80 font-black shadow-md shadow-yellow-500/20 ring-2 ring-yellow-500/30 scale-105'
                              : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 hover:border-yellow-500/80 dark:hover:border-yellow-400/80'
                          }`}
                        >
                          <input
                            type="color"
                            value={w.highlightColor || '#FACC15'}
                            onChange={(e) => handleWordColorChange(segment.id, w.id, e.target.value)}
                            title="Word highlight color"
                            className="w-4 h-4 rounded-full border-none bg-transparent cursor-pointer shrink-0"
                          />

                          <input
                            type="text"
                            value={w.word}
                            onChange={(e) => handleWordChange(segment.id, w.id, e.target.value)}
                            style={{ width: `${Math.max(w.word.length * 11 + 8, 42)}px` }}
                            className={`bg-transparent border-none outline-none text-base font-black leading-relaxed tracking-wide min-w-[42px] max-w-[220px] cursor-text ${
                              isWordActive ? 'text-yellow-600 dark:text-yellow-300 font-black' : 'text-slate-900 dark:text-white'
                            }`}
                          />

                          {/* Hover/Touch Emoji Selector */}
                          <div className="absolute -top-12 left-0 hidden group-hover:flex items-center gap-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-2xl shadow-2xl z-30 transition-all">
                            {EMOJI_PALETTE.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleEmojiToggle(segment.id, w.id, emoji)}
                                className="hover:scale-135 transition-transform text-lg cursor-pointer p-0.5"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>

                          {w.emoji && w.emoji !== '🔥' && <span className="text-base shrink-0 ml-0.5">{w.emoji}</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* 4. Bottom Controls Bar: Preset Style & Animation */}
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 dark:border-zinc-800/50" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-zinc-500">Style</span>
                      <CustomSelect
                        value={segment.styleOverride || ''}
                        onChange={(val) => handleSegmentPropChange(segment.id, 'styleOverride', val || null)}
                        options={PRESET_OPTIONS}
                        placeholder="Global Style"
                        buttonClassName="text-slate-900 dark:text-white font-bold max-w-[140px] text-xs py-1.5 px-2.5"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-zinc-500">Anim</span>
                      <CustomSelect
                        value={segment.animation || timeline.globalTheme?.animation || ''}
                        onChange={(val) => handleSegmentPropChange(segment.id, 'animation', val || null)}
                        options={ANIMATION_OPTIONS_15}
                        placeholder="Global Anim"
                        isUppercase
                        buttonClassName="text-slate-900 dark:text-white font-bold max-w-[140px] text-xs py-1.5 px-2.5"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Silence Gap Indicator (Only shown for major long silences > 10.0s) */}
                {segIdx < timeline.segments.length - 1 && (() => {
                  const nextSeg = timeline.segments[segIdx + 1];
                  const gap = (parseFloat(nextSeg.start || 0) - parseFloat(segment.end || 0)).toFixed(2);
                  if (parseFloat(gap) >= 10.0) {
                    return (
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-mono my-2 shadow-2xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                          <span>{gap}s Long Audio Silence</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSnapSilenceGap(segment.id, nextSeg.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-black text-xs hover:bg-amber-400 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          title="Snap next timeframe start time to end of this timeframe"
                        >
                          ⚡ Snap Silence
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </React.Fragment>
            );
          })}
        </div>
      )}

      <FontPickerModal
        isOpen={activeSegmentFontPickerId !== null}
        onClose={() => setActiveSegmentFontPickerId(null)}
        selectedFont={
          timeline.segments.find((s) => s.id === activeSegmentFontPickerId)?.fontStyle?.fontFamily || 'Inter'
        }
        onSelectFont={(font) => {
          if (activeSegmentFontPickerId) {
            handleSegmentPropChange(activeSegmentFontPickerId, 'fontFamily', font);
          }
        }}
        title="Timeframe Custom Font Studio"
      />
    </div>
  );
}

function formatTime(sec) {
  if (!sec && sec !== 0) return '0.00s';
  return `${sec.toFixed(2)}s`;
}
