import React, { useState } from 'react';
import { Clock, Edit3, Settings2 } from 'lucide-react';
import { THEME_PRESETS } from '../../../../shared/constants/timeline';

const EMOJI_PALETTE = ['⚡', '💸', '🚀', '✨', '🤖', '👑', '💥', '❤️', '🎯', '💡', '💎'];
const ANIMATION_OPTIONS = ['pop', 'bounce', 'slide', 'glow', 'wave', 'none'];

const FONT_FAMILIES_50 = [
  'Inter',
  'Montserrat',
  'Outfit',
  'Roboto',
  'Poppins',
  'Oswald',
  'Bebas Neue',
  'Anton',
  'Pacifico',
  'Dancing Script',
  'Caveat',
  'Great Vibes',
  'Satisfy',
  'Lobster',
  'Permanent Marker',
  'Playfair Display',
  'Cinzel',
  'Abril Fatface',
  'Bungee',
  'Rubik Glitch',
  'Press Start 2P',
  'Righteous',
  'Space Grotesk',
  'Syne',
  'Fredoka',
  'Kanit',
  'Cinzel Decorative',
  'Marck Script',
  'Sacramento',
  'Yellowtail',
  'Alex Brush',
  'Parisienne',
  'Shadows Into Light',
  'Indie Flower',
  'Amatic SC',
  'Chewy',
  'Luckiest Guy',
  'Bangers',
  'Special Elite',
  'Orbitron',
  'Shrikhand',
  'Changa One',
  'Ultra',
  'Black Ops One',
  'Russo One',
  'Staatliches',
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

export default function TimelineEditor({ timeline, setTimeline, currentTime, setCurrentTime }) {
  const [selectedSegId, setSelectedSegId] = useState(null);
  const [expandedSegId, setExpandedSegId] = useState(null);

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

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Time-Frame Granular Studio
          </h3>
        </div>
        <span className="text-xs text-zinc-400 font-mono">
          {timeline.segments.length} time blocks
        </span>
      </div>

      <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
        {timeline.segments.map((segment, segIdx) => {
          const isActive = currentTime >= segment.start && currentTime <= segment.end;
          const isExpanded = expandedSegId === segment.id;

          return (
            <div
              key={segment.id || segIdx}
              onClick={() => {
                setCurrentTime(segment.start);
                setSelectedSegId(segment.id);
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'border-yellow-400 bg-yellow-400/10 shadow-md shadow-yellow-500/10'
                  : 'border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <span className="text-[11px] font-mono text-zinc-300 flex items-center gap-1 font-semibold">
                  <Clock className="w-3 h-3 text-yellow-400" />
                  {formatTime(segment.start)} → {formatTime(segment.end)}
                </span>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={segment.styleOverride || ''}
                    onChange={(e) => handleSegmentPropChange(segment.id, 'styleOverride', e.target.value || null)}
                    className="bg-zinc-900 border border-zinc-700 text-[10px] text-yellow-400 font-bold rounded px-2 py-0.5 outline-none max-w-[130px]"
                  >
                    <option value="">Global Style</option>
                    {PRESET_OPTIONS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={segment.animation || 'pop'}
                    onChange={(e) => handleSegmentPropChange(segment.id, 'animation', e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 text-[10px] text-zinc-300 font-bold rounded px-2 py-0.5 outline-none uppercase"
                  >
                    {ANIMATION_OPTIONS.map((anim) => (
                      <option key={anim} value={anim}>
                        {anim}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setExpandedSegId(isExpanded ? null : segment.id)}
                    className={`p-1 rounded text-xs font-bold transition flex items-center gap-1 ${
                      isExpanded
                        ? 'bg-yellow-400 text-black'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                    title="Customize 50+ Fonts, Size & Position for this exact timeframe"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div
                  className="mb-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-2 gap-3">
                    {/* Per-Segment 50+ Font Selector */}
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-400 block mb-1">
                        Font (50+ Styles)
                      </label>
                      <select
                        value={segment.fontStyle?.fontFamily || 'Inter'}
                        onChange={(e) => handleSegmentPropChange(segment.id, 'fontFamily', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-[11px] text-white outline-none"
                      >
                        {FONT_FAMILIES_50.map((font) => (
                          <option key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-zinc-400 block mb-1">
                        Size ({segment.fontStyle?.fontSize || 52}px)
                      </label>
                      <input
                        type="range"
                        min="30"
                        max="90"
                        value={segment.fontStyle?.fontSize || 52}
                        onChange={(e) => handleSegmentPropChange(segment.id, 'fontSize', parseInt(e.target.value, 10))}
                        className="w-full h-1 bg-zinc-800 accent-yellow-400 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-zinc-400 flex items-center justify-between mb-1">
                      <span>Vertical Position Y</span>
                      <span className="font-mono text-yellow-400">{segment.position?.y || 75}%</span>
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="85"
                      value={segment.position?.y || 75}
                      onChange={(e) => handleSegmentPropChange(segment.id, 'positionY', parseInt(e.target.value, 10))}
                      className="w-full h-1 bg-zinc-800 accent-yellow-400 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {segment.words.map((w) => (
                  <div
                    key={w.id}
                    className="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-xs font-semibold hover:border-yellow-400/80 transition"
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
                      className="bg-transparent border-none outline-none w-auto max-w-[110px] text-xs font-bold text-white"
                    />

                    <div className="absolute -top-10 left-0 hidden group-hover:flex items-center gap-1 bg-zinc-950 border border-zinc-700 px-2 py-1 rounded-lg shadow-2xl z-30 transition-all">
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
    </div>
  );
}

function formatTime(sec) {
  if (!sec && sec !== 0) return '0.0s';
  return `${sec.toFixed(1)}s`;
}
