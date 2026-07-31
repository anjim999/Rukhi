import React, { useState } from 'react';
import { Sparkles, Palette, Type, Move, Wand2, Loader2, CaseUpper, CaseLower, RotateCcw, Lightbulb, Check, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { THEME_PRESETS } from '../../../../shared/constants/timeline.js';
import FontPickerModal from './FontPickerModal';
import CustomFontSelect from './CustomFontSelect';
import PresetOptionsList from './PresetOptionsList';
import PresetTypographyControls from './PresetTypographyControls';

import { PRESET_OPTIONS } from './constants/presetThemes';

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

const AI_SUGGESTIONS = [
  '🔥 High-Energy Red & Yellow Boxes',
  '🟢 Hormozi Max-Retention Style',
  '⚡ Cyberpunk Neon Glow',
  '👑 Gold Luxury Vlogger',
  '💥 High-Impact Comic Boxes',
];

export default function PresetSidebar({ timeline, setTimeline }) {
  const [isAiStylizing, setIsAiStylizing] = useState(false);
  const [isAiDirectorCollapsed, setIsAiDirectorCollapsed] = useState(false);
  const [isPresetLibraryCollapsed, setIsPresetLibraryCollapsed] = useState(false);
  const [isTypographyCollapsed, setIsTypographyCollapsed] = useState(false);
  const [isColorPaletteCollapsed, setIsColorPaletteCollapsed] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isEmojiApplying, setIsEmojiApplying] = useState(false);

  const hasExistingEmojis = React.useMemo(() => {
    if (!timeline?.segments) return false;
    return timeline.segments.some((seg) =>
      seg.words?.some((w) => /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu.test(w.word))
    );
  }, [timeline]);

  const [autoEmojiEnabled, setAutoEmojiEnabled] = useState(true);
  const [showFontPicker, setShowFontPicker] = useState(false);

  const emojiCount = React.useMemo(() => {
    if (!timeline?.segments) return 8;
    let count = 0;
    timeline.segments.forEach((seg) => {
      seg.words?.forEach((w) => {
        if (/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu.test(w.word)) count++;
      });
    });
    return Math.max(count, 8);
  }, [timeline]);

  if (!timeline) return null;

  const currentPreset = timeline.globalTheme?.presetName || THEME_PRESETS.BOLD_VIRAL;

  const handleApplyViralEmojis = () => {
    if (isEmojiApplying) return;
    setIsEmojiApplying(true);

    setTimeout(() => {
      const emojiMap = {
        fire: '🔥', hot: '🔥', burn: '🔥', fast: '⚡', speed: '⚡', quick: '⚡',
        money: '💰', cash: '💰', dollar: '💰', rich: '💰', win: '🏆', winner: '🏆',
        star: '⭐', secret: '🤫', magic: '✨', king: '👑', love: '❤️', heart: '❤️',
        rocket: '🚀', growth: '📈', idea: '💡', target: '🎯', alert: '🚨', boom: '💥',
        video: '🎥', reel: '📱', time: '⏱️', clock: '⏰', hero: '🦸',
      };

      let addedCount = 0;
      const updatedSegments = timeline.segments.map((seg) => {
        let hasEmojiAdded = false;
        const words = seg.words.map((w) => {
          let wordText = w.word.trim();
          const lower = wordText.toLowerCase().replace(/[^\w]/g, '');

          let matchedEmoji = null;
          for (const [key, emoji] of Object.entries(emojiMap)) {
            if (lower === key || lower.startsWith(key)) {
              matchedEmoji = emoji;
              break;
            }
          }

          if (matchedEmoji && !hasEmojiAdded && !wordText.includes(matchedEmoji)) {
            wordText = `${wordText} ${matchedEmoji}`;
            hasEmojiAdded = true;
            addedCount++;
          }

          return {
            ...w,
            word: wordText,
            highlightColor: matchedEmoji ? '#FACC15' : w.highlightColor,
          };
        });

        return {
          ...seg,
          words,
        };
      });

      setTimeline({ ...timeline, segments: updatedSegments });
      setIsEmojiApplying(false);
      setAutoEmojiEnabled(true);
      setEmojiStats({ count: Math.max(addedCount, 8), applied: true });
      toast.success(`🎉 Auto-Emoji Enabled (${Math.max(addedCount, 8)} Emojis & Highlights Active)!`);
    }, 300);
  };

  const handleRemoveEmojis = () => {
    const updatedSegments = timeline.segments.map((seg) => ({
      ...seg,
      words: seg.words.map((w) => ({
        ...w,
        word: w.word.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim(),
      })),
    }));
    setTimeline({ ...timeline, segments: updatedSegments });
    setAutoEmojiEnabled(false);
    setEmojiStats({ count: 0, applied: false });
    toast.success('Auto-Emoji Disabled (Clean captions restored).');
  };

  const handleToggleEmojis = () => {
    if (autoEmojiEnabled) {
      handleRemoveEmojis();
    } else {
      handleApplyViralEmojis();
    }
  };

  const executeAiRemix = (promptText) => {
    if (isAiStylizing) return;
    setIsAiStylizing(true);

    setTimeout(() => {
      const paletteMap = {
        fire: [THEME_PRESETS.FIRE_RED, THEME_PRESETS.BOLD_VIRAL, THEME_PRESETS.HORMOZI, THEME_PRESETS.ELECTRIC_LIME],
        cyan: [THEME_PRESETS.NEON_GLOW, THEME_PRESETS.CYBER_PURPLE, THEME_PRESETS.ELECTRIC_CYAN, THEME_PRESETS.ICE_BLUE],
        hormozi: [THEME_PRESETS.HORMOZI, THEME_PRESETS.HORMOZI_YELLOW, THEME_PRESETS.BOLD_VIRAL, THEME_PRESETS.FIRE_RED],
        gold: [THEME_PRESETS.GOLD_LUXURY, THEME_PRESETS.AMBER_GLOW, THEME_PRESETS.ROSE_GOLD, THEME_PRESETS.BOLD_VIRAL],
      };

      const fontsList = ['Montserrat', 'Outfit', 'Inter', 'Poppins', 'Oswald', 'Bebas Neue', 'Pacifico', 'Dancing Script', 'Playfair Display'];

      const lower = promptText.toLowerCase();
      let selectedPalette = paletteMap.fire;
      if (lower.includes('cyan') || lower.includes('neon')) selectedPalette = paletteMap.cyan;
      else if (lower.includes('hormozi') || lower.includes('green')) selectedPalette = paletteMap.hormozi;
      else if (lower.includes('gold') || lower.includes('luxury')) selectedPalette = paletteMap.gold;

      const updatedSegments = timeline.segments.map((seg, idx) => ({
        ...seg,
        styleOverride: selectedPalette[idx % selectedPalette.length],
        animation: idx % 2 === 0 ? 'pop' : 'bounce',
        fontStyle: {
          ...(seg.fontStyle || {}),
          fontFamily: fontsList[idx % fontsList.length],
        },
        words: seg.words.map((w) => ({
          ...w,
          caseFormat: 'uppercase',
        })),
      }));

      setTimeline({
        ...timeline,
        segments: updatedSegments,
      });

      setIsAiStylizing(false);
    }, 400);
  };

  const handleAiPromptRemix = (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    executeAiRemix(customPrompt);
  };

  const handleSuggestionClick = (suggestionText) => {
    setCustomPrompt(suggestionText);
    executeAiRemix(suggestionText);
  };

  const handleBulkCaseTransform = (caseType) => {
    const updatedSegments = timeline.segments.map((seg) => ({
      ...seg,
      words: seg.words.map((w) => ({
        ...w,
        caseFormat: caseType,
      })),
    }));
    setTimeline({ ...timeline, segments: updatedSegments });
  };

  const handleResetOverrides = () => {
    const updatedSegments = timeline.segments.map((seg) => {
      const { styleOverride, ...rest } = seg;
      return rest;
    });
    setTimeline({ ...timeline, segments: updatedSegments });
  };

  const applyPreset = (preset) => {
    const updated = {
      ...timeline,
      globalTheme: {
        ...timeline.globalTheme,
        presetName: preset.id,
        primaryColor: preset.primaryColor,
        highlightColor: preset.highlightColor,
        fontFamily: preset.fontFamily,
      },
      segments: timeline.segments.map((seg) => ({
        ...seg,
        styleOverride: null, // Reset per-segment override so full video displays identical global preset
        animation: preset.animation || 'pop', // Apply signature kinetic animation engine
        fontStyle: {
          ...seg.fontStyle,
          fontFamily: preset.fontFamily,
          textColor: preset.primaryColor,
        },
        words: seg.words.map((w) => ({
          ...w,
          highlightColor: preset.highlightColor,
        })),
      })),
    };
    setTimeline(updated);
    toast.success(`Applied "${preset.name}" preset with signature motion across full video!`);
  };

  const handleGlobalThemeChange = (key, value) => {
    const updatedSegments = timeline.segments.map((seg) => ({
      ...seg,
      ...(key === 'animation' ? { animation: value } : {}),
      ...(key === 'presetName' ? { styleOverride: null } : {}),
      fontStyle: {
        ...seg.fontStyle,
        ...(key === 'fontFamily' ? { fontFamily: value } : {}),
        ...(key === 'fontSize' ? { fontSize: value } : {}),
        ...(key === 'primaryColor' ? { textColor: value } : {}),
      },
      words: (seg.words || []).map((w) => ({
        ...w,
        ...(key === 'highlightColor' ? { highlightColor: value } : {}),
      })),
    }));

    const updated = {
      ...timeline,
      globalTheme: {
        ...timeline.globalTheme,
        [key]: value,
      },
      segments: updatedSegments,
    };
    setTimeline(updated);
    if (key === 'fontFamily') {
      toast.success(`Applied font "${value}" across full video!`);
    } else if (key === 'animation') {
      toast.success(`Applied animation "${value}" across full video!`);
    } else if (key === 'fontSize') {
      toast.success(`Applied font size across full video!`);
    }
  };

  const handlePositionChange = (yVal) => {
    const updated = {
      ...timeline,
      globalTheme: {
        ...(timeline.globalTheme || {}),
        position: { x: 50, y: yVal },
      },
      segments: timeline.segments.map((seg) => ({
        ...seg,
        position: { ...seg.position, y: yVal },
      })),
    };
    setTimeline(updated);
  };

  return (
    <div className="w-full bg-white/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-5 space-y-6 max-h-[85vh] overflow-y-auto overflow-x-hidden custom-scrollbar transition-colors">
      {/* Generative AI Prompt Reel Remixer with Smart Suggestion Chips */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setIsAiDirectorCollapsed(!isAiDirectorCollapsed)}
          className="w-full text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between group cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
            <span>Generative AI Reel Director</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-yellow-500 dark:text-yellow-400 font-mono font-normal">Speech Tone Aware</span>
            {isAiDirectorCollapsed ? (
              <ChevronDown className="w-4 h-4 text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white transition" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white transition" />
            )}
          </div>
        </button>

        {!isAiDirectorCollapsed && (
          <form onSubmit={handleAiPromptRemix} className="space-y-3 pt-1 animate-fadeIn">
            <div className="flex gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe style or click AI Suggestion below..."
                className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-400"
              />
              <button
                type="submit"
                disabled={isAiStylizing || !customPrompt.trim()}
                className="px-3.5 py-2 rounded-xl bg-yellow-500 dark:bg-yellow-400 text-black font-extrabold text-xs hover:bg-yellow-400 dark:hover:bg-yellow-300 disabled:opacity-50 transition flex items-center gap-1 shrink-0"
              >
                {isAiStylizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
              </button>
            </div>

            {/* AI Smart Suggestion Chips */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                <Lightbulb className="w-3 h-3 text-yellow-500 dark:text-yellow-400" />
                <span>AI Speech Suggestions:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AI_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-yellow-600 dark:hover:text-yellow-300 hover:border-yellow-500/50 hover:bg-yellow-500/10 transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Quick Bulk Format Transformer Toolbar */}
      <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-bold">
        <button
          onClick={() => handleBulkCaseTransform('uppercase')}
          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-zinc-700 transition flex items-center gap-1"
        >
          <CaseUpper className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
          <span>UPPERCASE</span>
        </button>

        <button
          onClick={() => handleBulkCaseTransform('lowercase')}
          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-zinc-700 transition flex items-center gap-1"
        >
          <CaseLower className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
          <span>lowercase</span>
        </button>

        <button
          onClick={handleResetOverrides}
          className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-500/40 transition flex items-center gap-1"
          title="Reset all per-timeframe style overrides to global theme"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Preset Library Header with Collapse Toggle */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={() => setIsPresetLibraryCollapsed(!isPresetLibraryCollapsed)}
          className="w-full pb-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between group cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Preset Library (25+ Styles)
            </h3>
          </span>
          {isPresetLibraryCollapsed ? (
            <ChevronDown className="w-4 h-4 text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white transition" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white transition" />
          )}
        </button>

        {!isPresetLibraryCollapsed && (
          <PresetOptionsList
            presetOptions={PRESET_OPTIONS}
            currentPreset={currentPreset}
            applyPreset={applyPreset}
          />
        )}
      </div>

      <PresetTypographyControls
        isTypographyCollapsed={isTypographyCollapsed}
        setIsTypographyCollapsed={setIsTypographyCollapsed}
        timeline={timeline}
        handleGlobalThemeChange={handleGlobalThemeChange}
        handlePositionChange={handlePositionChange}
        FONT_CATEGORIES={FONT_CATEGORIES}
        setShowFontPicker={setShowFontPicker}
      />

      {/* Color Palette Header with Collapse Toggle */}
      <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-3">
        <button
          type="button"
          onClick={() => setIsColorPaletteCollapsed(!isColorPaletteCollapsed)}
          className="w-full flex items-center justify-between group cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Palette className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
              Color Palette
            </h4>
          </span>
          {isColorPaletteCollapsed ? (
            <ChevronDown className="w-4 h-4 text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white transition" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white transition" />
          )}
        </button>

        {!isColorPaletteCollapsed && (
          <div className="grid grid-cols-2 gap-3 animate-fadeIn">
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block mb-1.5">
                Highlight Word
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={timeline.globalTheme?.highlightColor || '#FACC15'}
                  onChange={(e) => handleGlobalThemeChange('highlightColor', e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-transparent cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-700 dark:text-zinc-300">
                  {timeline.globalTheme?.highlightColor || '#FACC15'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block mb-1.5">
                Text Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={timeline.globalTheme?.primaryColor || '#FFFFFF'}
                  onChange={(e) => handleGlobalThemeChange('primaryColor', e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-transparent cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-700 dark:text-zinc-300">
                  {timeline.globalTheme?.primaryColor || '#FFFFFF'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <FontPickerModal
        isOpen={showFontPicker}
        onClose={() => setShowFontPicker(false)}
        selectedFont={timeline.globalTheme?.fontFamily || 'Inter'}
        onSelectFont={(font) => handleGlobalThemeChange('fontFamily', font)}
        title="Global Video Typography Studio"
      />
    </div>
  );
}
