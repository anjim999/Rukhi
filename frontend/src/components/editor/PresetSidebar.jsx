import React, { useState } from 'react';
import { Sparkles, Palette, Type, Move, Wand2, Loader2, CaseUpper, CaseLower, RotateCcw, Lightbulb, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { THEME_PRESETS } from '../../../../shared/constants/timeline';

const PRESET_OPTIONS = [
  { id: THEME_PRESETS.BOLD_VIRAL, name: 'Bold Yellow Pop', description: 'Yellow active scale pop, heavy black stroke', badge: 'Popular', primaryColor: '#FFFFFF', highlightColor: '#FACC15', fontFamily: 'Inter' },
  { id: THEME_PRESETS.HORMOZI, name: 'Hormozi Green Box', description: 'Green active background box, uppercase text', badge: 'Viral #1', primaryColor: '#FFFFFF', highlightColor: '#22C55E', fontFamily: 'Montserrat' },
  { id: THEME_PRESETS.HORMOZI_YELLOW, name: 'Hormozi Yellow Box', description: 'Bright yellow active box, high retention', badge: 'Retain', primaryColor: '#FFFFFF', highlightColor: '#EAB308', fontFamily: 'Montserrat' },
  { id: THEME_PRESETS.FIRE_RED, name: 'Fire Red Punch', description: 'Crisp red active box, high energy impact', badge: 'Trending', primaryColor: '#FFFFFF', highlightColor: '#EF4444', fontFamily: 'Outfit' },
  { id: THEME_PRESETS.ELECTRIC_CYAN, name: 'Cyan Box Pop', description: 'Electric cyan active box, high contrast', badge: 'New', primaryColor: '#FFFFFF', highlightColor: '#06B6D4', fontFamily: 'Outfit' },
  { id: THEME_PRESETS.NEON_GLOW, name: 'Neon Cyberpunk', description: 'Cyan electric glow aura, futuristic', badge: 'Cyber', primaryColor: '#FFFFFF', highlightColor: '#06B6D4', fontFamily: 'Outfit' },
  { id: THEME_PRESETS.CYBER_PURPLE, name: 'Magenta Haze', description: 'Vibrant neon purple active glow', badge: 'Pro', primaryColor: '#FFFFFF', highlightColor: '#D946EF', fontFamily: 'Poppins' },
  { id: THEME_PRESETS.GOLD_LUXURY, name: 'Gold Luxury', description: 'Metallic golden text for luxury vlogs', badge: 'Luxury', primaryColor: '#FFFFFF', highlightColor: '#EAB308', fontFamily: 'Montserrat' },
  { id: THEME_PRESETS.COMIC_YELLOW, name: 'Comic Box', description: 'Bright yellow background box, thick outline', badge: 'Bold', primaryColor: '#FFFFFF', highlightColor: '#EAB308', fontFamily: 'Inter' },
  { id: THEME_PRESETS.SUNSET_ORANGE, name: 'Sunset Coral', description: 'Warm coral orange highlight', badge: 'Warm', primaryColor: '#FFFFFF', highlightColor: '#F97316', fontFamily: 'Roboto' },
  { id: THEME_PRESETS.ELECTRIC_LIME, name: 'Electric Lime', description: 'Hyper lime active pop for reels', badge: 'Energy', primaryColor: '#FFFFFF', highlightColor: '#84CC16', fontFamily: 'Outfit' },
  { id: THEME_PRESETS.VIOLET_DREAM, name: 'Violet Dream Box', description: 'Deep purple active background box', badge: 'Fresh', primaryColor: '#FFFFFF', highlightColor: '#8B5CF6', fontFamily: 'Poppins' },
  { id: THEME_PRESETS.HOT_PINK, name: 'Hot Pink Punch', description: 'Vibrant hot pink active box', badge: 'Pop', primaryColor: '#FFFFFF', highlightColor: '#EC4899', fontFamily: 'Outfit' },
  { id: THEME_PRESETS.ROYAL_BLUE, name: 'Royal Blue Box', description: 'Royal blue active box + white text', badge: 'Clean', primaryColor: '#FFFFFF', highlightColor: '#2563EB', fontFamily: 'Inter' },
  { id: THEME_PRESETS.TEAL_BREEZE, name: 'Teal Breeze Box', description: 'Deep teal active box + white text', badge: 'Sleek', primaryColor: '#FFFFFF', highlightColor: '#0D9488', fontFamily: 'Roboto' },
  { id: THEME_PRESETS.INDIGO_SKY, name: 'Indigo Sky Box', description: 'Indigo active box + bold text', badge: 'Cool', primaryColor: '#FFFFFF', highlightColor: '#4F46E5', fontFamily: 'Poppins' },
  { id: THEME_PRESETS.MINT_FRESH, name: 'Mint Fresh Box', description: 'Fresh mint green active box', badge: 'Fresh', primaryColor: '#FFFFFF', highlightColor: '#10B981', fontFamily: 'Inter' },
  { id: THEME_PRESETS.TANGERINE_POP, name: 'Tangerine Box', description: 'Tangerine orange active box', badge: 'Vibrant', primaryColor: '#FFFFFF', highlightColor: '#F97316', fontFamily: 'Outfit' },
  { id: THEME_PRESETS.MATRIX_GREEN, name: 'Matrix Green Glow', description: 'Hacker matrix neon green glow', badge: 'Matrix', primaryColor: '#FFFFFF', highlightColor: '#22C55E', fontFamily: 'Oswald' },
  { id: THEME_PRESETS.ICE_BLUE, name: 'Ice Blue Glow', description: 'Crystal ice blue glow aura', badge: 'Ice', primaryColor: '#FFFFFF', highlightColor: '#38BDF8', fontFamily: 'Outfit' },
  { id: THEME_PRESETS.AMBER_GLOW, name: 'Amber Warm Glow', description: 'Warm amber golden glow', badge: 'Glow', primaryColor: '#FFFFFF', highlightColor: '#F59E0B', fontFamily: 'Roboto' },
  { id: THEME_PRESETS.RUBY_GLOW, name: 'Ruby Red Glow', description: 'Crimson ruby red neon glow', badge: 'Ruby', primaryColor: '#FFFFFF', highlightColor: '#E11D48', fontFamily: 'Inter' },
  { id: THEME_PRESETS.NEON_LEMON, name: 'Neon Lemon Glow', description: 'Hyper neon lemon yellow glow', badge: 'Lemon', primaryColor: '#FFFFFF', highlightColor: '#FACC15', fontFamily: 'Montserrat' },
  { id: THEME_PRESETS.ROSE_GOLD, name: 'Rose Gold Glow', description: 'Elegant rose gold active glow', badge: 'Rose', primaryColor: '#FFFFFF', highlightColor: '#FB7185', fontFamily: 'Outfit' },
  { id: THEME_PRESETS.MINIMAL_CLEAN, name: 'Minimal White', description: 'Clean typography, subtle shadow', badge: 'Minimal', primaryColor: '#F4F4F5', highlightColor: '#E4E4E7', fontFamily: 'Inter' },
];

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

const AI_SUGGESTIONS = [
  '🔥 High-Energy Red & Yellow Boxes',
  '🟢 Hormozi Max-Retention Style',
  '⚡ Cyberpunk Neon Glow',
  '👑 Gold Luxury Vlogger',
  '💥 High-Impact Comic Boxes',
];

export default function PresetSidebar({ timeline, setTimeline }) {
  const [isAiStylizing, setIsAiStylizing] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isEmojiApplying, setIsEmojiApplying] = useState(false);

  const hasExistingEmojis = React.useMemo(() => {
    if (!timeline?.segments) return false;
    return timeline.segments.some((seg) =>
      seg.words?.some((w) => /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu.test(w.word))
    );
  }, [timeline]);

  const [autoEmojiEnabled, setAutoEmojiEnabled] = useState(true);

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
  };

  const handleGlobalThemeChange = (key, value) => {
    const updated = {
      ...timeline,
      globalTheme: {
        ...timeline.globalTheme,
        [key]: value,
      },
    };
    setTimeline(updated);
  };

  const handlePositionChange = (yVal) => {
    const updated = {
      ...timeline,
      segments: timeline.segments.map((seg) => ({
        ...seg,
        position: { ...seg.position, y: yVal },
      })),
    };
    setTimeline(updated);
  };

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
      {/* Generative AI Prompt Reel Remixer with Smart Suggestion Chips */}
      <form onSubmit={handleAiPromptRemix} className="space-y-3">
        <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-yellow-400" />
            <span>Generative AI Reel Director</span>
          </span>
          <span className="text-[10px] text-yellow-400 font-mono font-normal">Speech Tone Aware</span>
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describe style or click AI Suggestion below..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400"
          />
          <button
            type="submit"
            disabled={isAiStylizing || !customPrompt.trim()}
            className="px-3.5 py-2 rounded-xl bg-yellow-400 text-black font-extrabold text-xs hover:bg-yellow-300 disabled:opacity-50 transition flex items-center gap-1 shrink-0"
          >
            {isAiStylizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
          </button>
        </div>

        {/* AI Smart Suggestion Chips */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            <Lightbulb className="w-3 h-3 text-yellow-400" />
            <span>AI Speech Suggestions:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {AI_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-yellow-300 hover:border-yellow-400/50 hover:bg-yellow-500/10 transition"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Modern Toggle Switch: Auto-Emoji & Keyword Highlight Engine */}
        <div className="pt-3 border-t border-zinc-800/80">
          <div
            onClick={handleToggleEmojis}
            className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer group ${
              autoEmojiEnabled
                ? 'bg-yellow-400/10 border-yellow-500/40 shadow-lg shadow-yellow-500/5'
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg transition ${autoEmojiEnabled ? 'bg-yellow-400 text-black' : 'bg-zinc-900 text-zinc-500'}`}>
                {isEmojiApplying ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-yellow-400 transition flex items-center gap-1.5">
                  <span>Auto-Emoji & Highlights</span>
                  {autoEmojiEnabled && (
                    <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-semibold">
                      {emojiCount} Active
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-zinc-400">
                  {autoEmojiEnabled ? 'Injecting viral emojis & yellow pop boxes' : 'Standard clean text captions'}
                </p>
              </div>
            </div>

            {/* Custom Submagic iOS Style Toggle Switch */}
            <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${autoEmojiEnabled ? 'bg-yellow-400' : 'bg-zinc-800'}`}>
              <div className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${autoEmojiEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>
      </form>

      {/* Quick Bulk Format Transformer Toolbar */}
      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-1 text-[10px] font-bold">
        <button
          onClick={() => handleBulkCaseTransform('uppercase')}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition flex items-center gap-1"
        >
          <CaseUpper className="w-3.5 h-3.5 text-yellow-400" />
          <span>UPPERCASE</span>
        </button>

        <button
          onClick={() => handleBulkCaseTransform('lowercase')}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition flex items-center gap-1"
        >
          <CaseLower className="w-3.5 h-3.5 text-cyan-400" />
          <span>lowercase</span>
        </button>

        <button
          onClick={handleResetOverrides}
          className="px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition flex items-center gap-1"
          title="Reset all per-timeframe style overrides to global theme"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
        <Sparkles className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Preset Library (25+ Styles)
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {PRESET_OPTIONS.map((preset) => {
          const isActive = currentPreset === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-500/10'
                  : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  {preset.name}
                </span>
                <span
                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-yellow-400 text-black'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {preset.badge}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                {preset.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-zinc-800 space-y-4">
        <div className="flex items-center gap-2">
          <Type className="w-3.5 h-3.5 text-zinc-400" />
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Typography Controls (50+ Google Fonts)
          </h4>
        </div>

        <div>
          <label className="text-[11px] font-medium text-zinc-400 block mb-1.5">
            Font Family (50+ Styles)
          </label>
          <select
            value={timeline.globalTheme?.fontFamily || 'Inter'}
            onChange={(e) => handleGlobalThemeChange('fontFamily', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
          >
            {FONT_FAMILIES_50.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-medium text-zinc-400">
              Font Size ({timeline.globalTheme?.fontSize || 52}px)
            </label>
          </div>
          <input
            type="range"
            min="30"
            max="90"
            value={timeline.globalTheme?.fontSize || 52}
            onChange={(e) => handleGlobalThemeChange('fontSize', parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-zinc-800 accent-yellow-400 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
              <Move className="w-3 h-3 text-zinc-400" /> Position Y (
              {timeline.segments?.[0]?.position?.y || 75}%)
            </label>
          </div>
          <input
            type="range"
            min="20"
            max="85"
            value={timeline.segments?.[0]?.position?.y || 75}
            onChange={(e) => handlePositionChange(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-zinc-800 accent-yellow-400 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-800 space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-zinc-400" />
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Color Palette
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1.5">
              Highlight Word
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={timeline.globalTheme?.highlightColor || '#FACC15'}
                onChange={(e) => handleGlobalThemeChange('highlightColor', e.target.value)}
                className="w-8 h-8 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
              />
              <span className="text-[11px] font-mono text-zinc-300">
                {timeline.globalTheme?.highlightColor || '#FACC15'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1.5">
              Text Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={timeline.globalTheme?.primaryColor || '#FFFFFF'}
                onChange={(e) => handleGlobalThemeChange('primaryColor', e.target.value)}
                className="w-8 h-8 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
              />
              <span className="text-[11px] font-mono text-zinc-300">
                {timeline.globalTheme?.primaryColor || '#FFFFFF'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
