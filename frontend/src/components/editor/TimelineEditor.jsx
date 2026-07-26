import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, Edit3, Settings2, ChevronDown, ChevronUp, Scissors, GitMerge, Undo2, Redo2, Zap, MoveLeft, MoveRight, SlidersHorizontal, Sparkles } from 'lucide-react';
import { THEME_PRESETS, ANIMATION_TYPES } from '../../../../shared/constants/timeline';
import FontPickerModal from './FontPickerModal';
import CustomFontSelect from './CustomFontSelect';

const EMOJI_PALETTE = ['⚡', '💸', '🚀', '✨', '🤖', '👑', '💥', '❤️', '🎯', '💡', '💎'];

const ANIMATION_OPTIONS_15 = [
  { id: ANIMATION_TYPES.POP, name: 'Pop Scale' },
  { id: ANIMATION_TYPES.BOUNCE, name: 'Spring Bounce' },
  { id: ANIMATION_TYPES.ZOOM_IN, name: 'Zoom In (0.3x -> 1.3x)' },
  { id: ANIMATION_TYPES.ZOOM_OUT, name: 'Zoom Out (1.6x -> 1.0x)' },
  { id: ANIMATION_TYPES.FLOATING, name: 'Floating Sine Wave' },
  { id: ANIMATION_TYPES.SHAKE_RUMBLE, name: 'Vibration Rumble' },
  { id: ANIMATION_TYPES.FLIP_ROTATE, name: '3D Tilt Flip' },
  { id: ANIMATION_TYPES.SLIDE_UP, name: 'Slide Up' },
  { id: ANIMATION_TYPES.SLIDE_LEFT, name: 'Slide Left' },
  { id: ANIMATION_TYPES.GLOW_PULSE, name: 'Pulsing Glow' },
  { id: ANIMATION_TYPES.WAVE, name: 'Wave Motion' },
  { id: ANIMATION_TYPES.GLOW, name: 'Neon Aura' },
  { id: ANIMATION_TYPES.SLIDE, name: 'Smooth Slide' },
  { id: ANIMATION_TYPES.NONE, name: 'Static Clean' },
];

const FONT_CATEGORIES = [
  {
    label: '🇬🇧 English / Universal Sans & Serif',
    fonts: [
      'Inter', 'Montserrat', 'Outfit', 'Roboto', 'Poppins', 'Oswald', 'Bebas Neue', 'Anton',
      'Playfair Display', 'Space Grotesk', 'Syne', 'Kanit', 'Rubik Glitch', 'Cinzel',
      'Righteous', 'Fredoka', 'Staatliches', 'Russo One', 'Ultra', 'Black Ops One'
    ],
  },
  {
    label: '✨ English Display & Kinetic Styles',
    fonts: [
      'Pacifico', 'Dancing Script', 'Caveat', 'Great Vibes', 'Satisfy', 'Lobster',
      'Permanent Marker', 'Abril Fatface', 'Bungee', 'Press Start 2P',
      'Cinzel Decorative', 'Marck Script', 'Sacramento', 'Yellowtail', 'Alex Brush',
      'Parisienne', 'Shadows Into Light', 'Indie Flower', 'Amatic SC', 'Chewy',
      'Luckiest Guy', 'Bangers', 'Special Elite', 'Orbitron', 'Shrikhand', 'Changa One'
    ],
  },
  {
    label: '🇮🇳 Hindi (Devanagari) Fonts',
    fonts: [
      'Yatra One', 'Rozha One', 'Hind', 'Teko', 'Mukta', 'Gotu', 'Modak', 'Rajdhani',
      'Kalam', 'Amita', 'Eczar', 'Karma', 'Martel', 'Ranga', 'Sarala', 'Tillana', 'Vesper Libre'
    ],
  },
  {
    label: '🇮🇳 Telugu Fonts',
    fonts: [
      'Ramabhadra', 'Gidugu', 'NTR', 'Suranna', 'Lakki Reddy', 'Peddana', 'Chathura', 'Ponnala',
      'Dhurjati', 'Gurajada', 'Mallanna', 'Ravi Prakash', 'Tenali Ramakrishna', 'Sree Krushnadevaraya', 'Timmana'
    ],
  },
];

const PRESET_OPTIONS = [
  { id: THEME_PRESETS.HORMOZI, name: 'Hormozi Green Box' },
  { id: THEME_PRESETS.HORMOZI_YELLOW, name: 'Hormozi Yellow Box' },
  { id: THEME_PRESETS.FIRE_RED, name: 'Fire Red Box' },
  { id: THEME_PRESETS.ELECTRIC_CYAN, name: 'Cyan Box' },
  { id: THEME_PRESETS.HOT_PINK, name: 'Hot Pink Box' },
  { id: THEME_PRESETS.VIOLET_DREAM, name: 'Violet Dream Box' },
  { id: THEME_PRESETS.ROYAL_BLUE, name: 'Royal Blue Box' },
  { id: THEME_PRESETS.TEAL_BREEZE, name: 'Teal Breeze Box' },
  { id: THEME_PRESETS.ELECTRIC_LIME, name: 'Electric Lime Box' },
  { id: THEME_PRESETS.INDIGO_SKY, name: 'Indigo Sky Box' },
  { id: THEME_PRESETS.MINT_FRESH, name: 'Mint Fresh Box' },
  { id: THEME_PRESETS.TANGERINE_POP, name: 'Tangerine Box' },
  { id: THEME_PRESETS.COMIC_YELLOW, name: 'Comic Yellow Box' },
  { id: THEME_PRESETS.NEON_GLOW, name: 'Neon Cyan Glow' },
  { id: THEME_PRESETS.CYBER_PURPLE, name: 'Magenta Haze Glow' },
  { id: THEME_PRESETS.MATRIX_GREEN, name: 'Matrix Green Glow' },
  { id: THEME_PRESETS.ICE_BLUE, name: 'Ice Blue Glow' },
  { id: THEME_PRESETS.AMBER_GLOW, name: 'Amber Glow' },
  { id: THEME_PRESETS.RUBY_GLOW, name: 'Ruby Red Glow' },
  { id: THEME_PRESETS.NEON_LEMON, name: 'Neon Lemon Glow' },
  { id: THEME_PRESETS.ROSE_GOLD, name: 'Rose Gold Glow' },
  { id: THEME_PRESETS.GOLD_LUXURY, name: 'Gold Luxury' },
  { id: THEME_PRESETS.BOLD_VIRAL, name: 'Bold Yellow Pop' },
  { id: THEME_PRESETS.MINIMAL_CLEAN, name: 'Minimal White' },
];

export default function TimelineEditor({ timeline, setTimeline, currentTime, setCurrentTime, onUndo, onRedo, canUndo, canRedo }) {
  const [selectedSegId, setSelectedSegId] = useState(null);
  const [expandedSegId, setExpandedSegId] = useState(null);
  const [isStudioCollapsed, setIsStudioCollapsed] = useState(false);
  const [rippleEnabled, setRippleEnabled] = useState(true);
  const [globalShiftInput, setGlobalShiftInput] = useState('0.00');
  const [showGlobalShift, setShowGlobalShift] = useState(false);
  const [activeSegmentFontPickerId, setActiveSegmentFontPickerId] = useState(null);

  const containerRef = useRef(null);
  const itemRefs = useRef({});

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

  if (!timeline || !timeline.segments) return null;

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

  return (
    <div className="w-full bg-white/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 max-h-[85vh] flex flex-col transition-colors">
      <div className="w-full pb-3 border-b border-slate-200 dark:border-zinc-800 flex flex-col gap-2.5">
        {/* Row 1: Header Title & Collapse Toggle */}
        <div className="flex items-center justify-between gap-2">
          <div
            onClick={() => setIsStudioCollapsed(!isStudioCollapsed)}
            className="flex items-center gap-2 cursor-pointer select-none group hover:opacity-80 transition"
            title="Click to toggle Time-Frame Granular Studio view"
          >
            <Edit3 className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Time-Frame Granular Studio
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span
              onClick={() => setIsStudioCollapsed(!isStudioCollapsed)}
              className="text-xs text-slate-500 dark:text-zinc-400 font-mono cursor-pointer select-none"
            >
              {timeline.segments.length} time blocks
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

        {/* Row 2: Tool Action Controls (Spacious & Clean) */}
        {!isStudioCollapsed && (
          <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
            <div className="flex items-center gap-2">
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
                    ? 'Ripple Sync ON: Changing any time frame automatically shifts all downstream captions'
                    : 'Ripple Sync OFF: Edit time frames independently without moving downstream captions'
                }
              >
                <Zap className={`w-3.5 h-3.5 ${rippleEnabled ? 'text-yellow-500 animate-pulse' : 'text-slate-400'}`} />
                <span>Ripple Sync {rippleEnabled ? 'ON' : 'OFF'}</span>
              </button>

              {/* Global Offset Tool Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGlobalShift(!showGlobalShift);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  showGlobalShift
                    ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
                title="Global Delay & Offset Correction Tool"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-500" />
                <span>Global Shift</span>
              </button>
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
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between gap-3 text-xs animate-fadeIn">
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
      </div>

      {!isStudioCollapsed && (
        <div ref={containerRef} className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar animate-fadeIn">
          {timeline.segments.map((segment, segIdx) => {
            const isActive = currentTime >= segment.start && currentTime <= segment.end;
            const isExpanded = expandedSegId === segment.id;

            return (
              <div
                key={segment.id || segIdx}
                ref={(el) => {
                  if (el) itemRefs.current[segment.id] = el;
                }}
                onClick={() => {
                  setCurrentTime(segment.start);
                  setSelectedSegId(segment.id);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'border-yellow-500 dark:border-yellow-400 bg-yellow-500/10 dark:bg-yellow-400/10 shadow-md shadow-yellow-500/10'
                    : 'border-slate-200 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-950/40 hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-700 dark:text-zinc-300" onClick={(e) => e.stopPropagation()}>
                    <Clock className="w-3 h-3 text-yellow-500 dark:text-yellow-400 shrink-0" />
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={segment.start}
                      onChange={(e) => handleTimeChange(segment.id, 'start', e.target.value)}
                      className="w-14 bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700/80 focus:border-yellow-500 dark:focus:border-yellow-400 text-yellow-600 dark:text-yellow-400 font-bold rounded px-1 py-0.5 text-center text-[11px] focus:outline-none"
                      title="Edit start time in seconds"
                    />
                    <span className="text-slate-400 dark:text-zinc-500">→</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={segment.end}
                      onChange={(e) => handleTimeChange(segment.id, 'end', e.target.value)}
                      className="w-14 bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700/80 focus:border-yellow-500 dark:focus:border-yellow-400 text-yellow-600 dark:text-yellow-400 font-bold rounded px-1 py-0.5 text-center text-[11px] focus:outline-none"
                      title="Edit end time in seconds"
                    />
                    <span className="text-slate-400 dark:text-zinc-500 text-[10px]">s</span>

                    {/* Quick Nudge Buttons */}
                    <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-lg p-0.5 ml-1">
                      <button
                        type="button"
                        onClick={() => handleNudgeSegment(segment.id, -0.5)}
                        className="px-1 py-0.5 text-[9px] font-mono font-bold text-slate-600 dark:text-zinc-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded transition"
                        title="Nudge backward -0.5s (Shifts downstream captions if Ripple is ON)"
                      >
                        -0.5s
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudgeSegment(segment.id, -0.1)}
                        className="px-1 py-0.5 text-[9px] font-mono font-bold text-slate-600 dark:text-zinc-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded transition"
                        title="Nudge backward -0.1s"
                      >
                        -0.1s
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudgeSegment(segment.id, 0.1)}
                        className="px-1 py-0.5 text-[9px] font-mono font-bold text-slate-600 dark:text-zinc-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded transition"
                        title="Nudge forward +0.1s"
                      >
                        +0.1s
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudgeSegment(segment.id, 0.5)}
                        className="px-1 py-0.5 text-[9px] font-mono font-bold text-slate-600 dark:text-zinc-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded transition"
                        title="Nudge forward +0.5s (Shifts downstream captions if Ripple is ON)"
                      >
                        +0.5s
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={segment.styleOverride || ''}
                      onChange={(e) => handleSegmentPropChange(segment.id, 'styleOverride', e.target.value || null)}
                      className="bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-[10px] text-yellow-600 dark:text-yellow-400 font-bold rounded px-2 py-0.5 outline-none max-w-[130px]"
                    >
                      <option value="">Global Style</option>
                      {PRESET_OPTIONS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    {/* 15+ Kinetic Animation Dropdown */}
                    <select
                      value={segment.animation || 'pop'}
                      onChange={(e) => handleSegmentPropChange(segment.id, 'animation', e.target.value)}
                      className="bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-[10px] text-slate-700 dark:text-zinc-300 font-bold rounded px-2 py-0.5 outline-none uppercase max-w-[130px]"
                    >
                      {ANIMATION_OPTIONS_15.map((anim) => (
                        <option key={anim.id} value={anim.id}>
                          {anim.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleSplitSegment(segment.id)}
                      className="p-1 rounded text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition flex items-center gap-1"
                      title="Split timeblock into two segments at cursor"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                    </button>

                    {segIdx < timeline.segments.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMergeNextSegment(segment.id)}
                        className="p-1 rounded text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition flex items-center gap-1"
                        title="Merge this segment with the next segment"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedSegId(isExpanded ? null : segment.id)}
                      className={`p-1 rounded text-xs font-bold transition flex items-center gap-1 ${
                        isExpanded
                          ? 'bg-yellow-500 dark:bg-yellow-400 text-black'
                          : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Customize 50+ Fonts, Size & Position for this exact timeframe"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    className="mb-3 p-3 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 block mb-1">
                          Font (50+ Styles)
                        </label>
                        <CustomFontSelect
                          value={segment.fontStyle?.fontFamily || 'Inter'}
                          onChange={(font) => handleSegmentPropChange(segment.id, 'fontFamily', font)}
                          categories={FONT_CATEGORIES}
                        />
                        <button
                          type="button"
                          onClick={() => setActiveSegmentFontPickerId(segment.id)}
                          className="mt-1.5 w-full py-1 px-2 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 font-bold text-[10px] hover:bg-yellow-500/20 transition flex items-center justify-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Browse 70+ Fonts Studio</span>
                        </button>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 block mb-1">
                          Size ({segment.fontStyle?.fontSize || 52}px)
                        </label>
                        <input
                          type="range"
                          min="30"
                          max="90"
                          value={segment.fontStyle?.fontSize || 52}
                          onChange={(e) => handleSegmentPropChange(segment.id, 'fontSize', parseInt(e.target.value, 10))}
                          className="w-full h-1 bg-slate-200 dark:bg-zinc-800 accent-yellow-500 dark:accent-yellow-400 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center justify-between mb-1">
                        <span>Vertical Position Y</span>
                        <span className="font-mono text-yellow-600 dark:text-yellow-400">{segment.position?.y || 75}%</span>
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="85"
                        value={segment.position?.y || 75}
                        onChange={(e) => handleSegmentPropChange(segment.id, 'positionY', parseInt(e.target.value, 10))}
                        className="w-full h-1 bg-slate-200 dark:bg-zinc-800 accent-yellow-500 dark:accent-yellow-400 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center justify-between mb-1">
                        <span>Pacing (Words per line for this timeframe)</span>
                        <span className="font-mono text-yellow-600 dark:text-yellow-400 font-bold">
                          {segment.maxWordsPerLine || timeline.globalTheme?.maxWordsPerLine || 3} words
                        </span>
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[1, 2, 3, 4].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleSegmentPropChange(segment.id, 'maxWordsPerLine', num)}
                            className={`py-1 rounded text-[10px] font-bold transition border ${
                              (segment.maxWordsPerLine || timeline.globalTheme?.maxWordsPerLine || 3) === num
                                ? 'border-yellow-500 dark:border-yellow-400 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                                : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:border-slate-400'
                            }`}
                          >
                            {num === 1 ? '1 Word' : `${num} Words`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {segment.words.map((w) => (
                    <div
                      key={w.id}
                      className="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-white text-xs font-semibold hover:border-yellow-500/80 dark:hover:border-yellow-400/80 transition"
                    >
                      <input
                        type="color"
                        value={w.highlightColor || '#FACC15'}
                        onChange={(e) => handleWordColorChange(segment.id, w.id, e.target.value)}
                        title="Set custom color for this exact word"
                        className="w-3.5 h-3.5 rounded-full border-none bg-transparent cursor-pointer shrink-0"
                      />

                      <input
                        type="text"
                        value={w.word}
                        onChange={(e) => handleWordChange(segment.id, w.id, e.target.value)}
                        className="bg-transparent border-none outline-none w-auto max-w-[110px] text-xs font-bold text-slate-900 dark:text-white"
                      />

                      <div className="absolute -top-10 left-0 hidden group-hover:flex items-center gap-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 px-2 py-1 rounded-lg shadow-2xl z-30 transition-all">
                        {EMOJI_PALETTE.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleEmojiToggle(segment.id, w.id, emoji)}
                            className="hover:scale-125 transition-transform text-xs"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      {w.emoji && w.emoji !== '🔥' && <span className="text-xs shrink-0">{w.emoji}</span>}
                    </div>
                  ))}
                </div>
              </div>
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
