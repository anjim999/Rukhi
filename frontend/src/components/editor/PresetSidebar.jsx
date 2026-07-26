import React, { useState } from 'react';
import { Sparkles, Palette, Type, Move, Wand2, Loader2, CaseUpper, CaseLower, RotateCcw, Lightbulb, Check, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { THEME_PRESETS } from '../../../../shared/constants/timeline';
import FontPickerModal from './FontPickerModal';
import CustomFontSelect from './CustomFontSelect';

const PRESET_OPTIONS = [
  // 1. Creator & Influencer Viral Boxes
  { id: THEME_PRESETS.VIRAL_SCRIPT_HYBRID, name: 'Viral Script & Bold', description: 'Bold White Sans-Serif + Elegant Orange Cursive Script Emphasis', badge: '🔥 Viral #1', primaryColor: '#FFFFFF', highlightColor: '#F97316', fontFamily: 'Playfair Display', animation: 'streaming' },
  { id: THEME_PRESETS.HORMOZI, name: 'Hormozi Green Box', description: 'Green active background box, uppercase text', badge: 'Viral #1', primaryColor: '#FFFFFF', highlightColor: '#22C55E', fontFamily: 'Montserrat', animation: 'pop' },
  { id: THEME_PRESETS.HORMOZI_YELLOW, name: 'Hormozi Yellow Box', description: 'Bright yellow active box, high retention', badge: 'Retain', primaryColor: '#FFFFFF', highlightColor: '#EAB308', fontFamily: 'Montserrat', animation: 'elastic_spring' },
  { id: THEME_PRESETS.HORMOZI_RED, name: 'Hormozi Red Box', description: 'Crisp red active box, high energy impact', badge: 'Impact', primaryColor: '#FFFFFF', highlightColor: '#EF4444', fontFamily: 'Outfit', animation: 'bounce' },
  { id: THEME_PRESETS.BOLD_VIRAL, name: 'Bold Yellow Pop', description: 'Yellow active scale pop, heavy black stroke', badge: 'Popular', primaryColor: '#FFFFFF', highlightColor: '#FACC15', fontFamily: 'Inter', animation: 'zoom_in' },
  { id: THEME_PRESETS.MRBEAST_PUNCH, name: 'MrBeast High Punch', description: 'High contrast yellow & cyan dual active box', badge: 'MrBeast', primaryColor: '#FFFFFF', highlightColor: '#FACC15', fontFamily: 'Bebas Neue', animation: 'shake_rumble' },
  { id: THEME_PRESETS.GADZHI_MINIMAL, name: 'Gadzhi Aesthetic Serif', description: 'Iman Gadzhi clean serif & soft shadow', badge: 'Aesthetic', primaryColor: '#FFFFFF', highlightColor: '#E4E4E7', fontFamily: 'Playfair Display', animation: 'slide_up' },
  { id: THEME_PRESETS.SUBMAGIC_GLOW, name: 'Submagic Cyan Glow', description: 'Electric cyan active glow aura', badge: 'Submagic', primaryColor: '#FFFFFF', highlightColor: '#06B6D4', fontFamily: 'Outfit', animation: 'glow_pulse' },
  { id: THEME_PRESETS.ALI_ABDAAL, name: 'Ali Abdaal Clean Teal', description: 'Clean minimal teal accent for productivity vlogs', badge: 'Vlog', primaryColor: '#FFFFFF', highlightColor: '#0D9488', fontFamily: 'Poppins', animation: 'slide_left' },
  { id: THEME_PRESETS.DEV_INFLUENCER, name: 'Dev Code Neon', description: 'High-contrast cyan & lime neon for tech creators', badge: 'Tech', primaryColor: '#FFFFFF', highlightColor: '#06B6D4', fontFamily: 'Space Grotesk', animation: 'neon_aura' },

  // 2. High-Energy Neon & Cyberpunk Auras
  { id: THEME_PRESETS.NEON_GLOW, name: 'Neon Cyberpunk', description: 'Cyan electric glow aura, futuristic', badge: 'Cyber', primaryColor: '#FFFFFF', highlightColor: '#06B6D4', fontFamily: 'Outfit', animation: 'glow_pulse' },
  { id: THEME_PRESETS.CYBER_PURPLE, name: 'Magenta Haze', description: 'Vibrant neon purple active glow', badge: 'Pro', primaryColor: '#FFFFFF', highlightColor: '#D946EF', fontFamily: 'Poppins', animation: 'neon_aura' },
  { id: THEME_PRESETS.MATRIX_GREEN, name: 'Matrix Green Glow', description: 'Hacker matrix neon green glow', badge: 'Matrix', primaryColor: '#FFFFFF', highlightColor: '#22C55E', fontFamily: 'Oswald', animation: 'chromatic_glitch' },
  { id: THEME_PRESETS.ICE_BLUE, name: 'Ice Blue Glow', description: 'Crystal ice blue glow aura', badge: 'Ice', primaryColor: '#FFFFFF', highlightColor: '#38BDF8', fontFamily: 'Outfit', animation: 'zoom_in' },
  { id: THEME_PRESETS.AMBER_GLOW, name: 'Amber Warm Glow', description: 'Warm amber golden glow', badge: 'Glow', primaryColor: '#FFFFFF', highlightColor: '#F59E0B', fontFamily: 'Roboto', animation: 'bounce' },
  { id: THEME_PRESETS.RUBY_GLOW, name: 'Ruby Red Glow', description: 'Crimson ruby red neon glow', badge: 'Ruby', primaryColor: '#FFFFFF', highlightColor: '#E11D48', fontFamily: 'Inter', animation: 'shake_rumble' },
  { id: THEME_PRESETS.NEON_LEMON, name: 'Neon Lemon Glow', description: 'Hyper neon lemon yellow glow', badge: 'Lemon', primaryColor: '#FFFFFF', highlightColor: '#FACC15', fontFamily: 'Montserrat', animation: 'elastic_spring' },
  { id: THEME_PRESETS.ROSE_GOLD, name: 'Rose Gold Glow', description: 'Elegant rose gold active glow', badge: 'Rose', primaryColor: '#FFFFFF', highlightColor: '#FB7185', fontFamily: 'Outfit', animation: 'slide_up' },
  { id: THEME_PRESETS.NEON_ORANGE, name: 'Neon Sunset Orange', description: 'Vibrant electric sunset orange aura', badge: 'Sunset', primaryColor: '#FFFFFF', highlightColor: '#F97316', fontFamily: 'Outfit', animation: 'spin_reveal' },
  { id: THEME_PRESETS.NEON_LIME, name: 'Toxic Lime Glow', description: 'Hyper electric lime active aura', badge: 'Toxic', primaryColor: '#FFFFFF', highlightColor: '#84CC16', fontFamily: 'Outfit', animation: 'elastic_spring' },

  // 3. Pop Art & Comic Active Box Styles
  { id: THEME_PRESETS.COMIC_YELLOW, name: 'Comic Box', description: 'Bright yellow background box, thick outline', badge: 'Bold', primaryColor: '#FFFFFF', highlightColor: '#EAB308', fontFamily: 'Inter', animation: 'pop' },
  { id: THEME_PRESETS.FIRE_RED, name: 'Fire Red Punch', description: 'Crisp red active box, high energy impact', badge: 'Trending', primaryColor: '#FFFFFF', highlightColor: '#EF4444', fontFamily: 'Outfit', animation: 'bounce' },
  { id: THEME_PRESETS.ELECTRIC_CYAN, name: 'Cyan Box Pop', description: 'Electric cyan active box, high contrast', badge: 'New', primaryColor: '#FFFFFF', highlightColor: '#06B6D4', fontFamily: 'Outfit', animation: 'slide_left' },
  { id: THEME_PRESETS.ELECTRIC_LIME, name: 'Electric Lime', description: 'Hyper lime active pop for reels', badge: 'Energy', primaryColor: '#FFFFFF', highlightColor: '#84CC16', fontFamily: 'Outfit', animation: 'zoom_in' },
  { id: THEME_PRESETS.VIOLET_DREAM, name: 'Violet Dream Box', description: 'Deep purple active background box', badge: 'Fresh', primaryColor: '#FFFFFF', highlightColor: '#8B5CF6', fontFamily: 'Poppins', animation: 'slide_up' },
  { id: THEME_PRESETS.HOT_PINK, name: 'Hot Pink Punch', description: 'Vibrant hot pink active box', badge: 'Pop', primaryColor: '#FFFFFF', highlightColor: '#EC4899', fontFamily: 'Outfit', animation: 'elastic_spring' },
  { id: THEME_PRESETS.ROYAL_BLUE, name: 'Royal Blue Box', description: 'Royal blue active box + white text', badge: 'Clean', primaryColor: '#FFFFFF', highlightColor: '#2563EB', fontFamily: 'Inter', animation: 'slide_right' },
  { id: THEME_PRESETS.TEAL_BREEZE, name: 'Teal Breeze Box', description: 'Deep teal active box + white text', badge: 'Sleek', primaryColor: '#FFFFFF', highlightColor: '#0D9488', fontFamily: 'Roboto', animation: 'slide_down' },
  { id: THEME_PRESETS.TANGERINE_POP, name: 'Tangerine Box', description: 'Tangerine orange active box', badge: 'Vibrant', primaryColor: '#FFFFFF', highlightColor: '#F97316', fontFamily: 'Outfit', animation: 'spin_reveal' },
  { id: THEME_PRESETS.INDIGO_SKY, name: 'Indigo Sky Box', description: 'Indigo active box + bold text', badge: 'Cool', primaryColor: '#FFFFFF', highlightColor: '#4F46E5', fontFamily: 'Poppins', animation: 'bounce' },
  { id: THEME_PRESETS.MINT_FRESH, name: 'Mint Fresh Box', description: 'Fresh mint green active box', badge: 'Fresh', primaryColor: '#FFFFFF', highlightColor: '#10B981', fontFamily: 'Inter', animation: 'pop' },
  { id: THEME_PRESETS.CORAL_CRUSH, name: 'Coral Crush Box', description: 'Warm coral pink active box', badge: 'Warm', primaryColor: '#FFFFFF', highlightColor: '#F43F5E', fontFamily: 'Outfit', animation: 'slide_up' },
  { id: THEME_PRESETS.SUNSET_BURST, name: 'Sunset Burst Box', description: 'Warm sunset orange active box', badge: 'Burst', primaryColor: '#FFFFFF', highlightColor: '#EA580C', fontFamily: 'Poppins', animation: 'elastic_spring' },

  // 4. Luxury, Podcast & Aesthetic Vlogs
  { id: THEME_PRESETS.GOLD_LUXURY, name: 'Gold Luxury', description: 'Metallic golden text for luxury vlogs', badge: 'Luxury', primaryColor: '#FFFFFF', highlightColor: '#EAB308', fontFamily: 'Montserrat', animation: 'glow_pulse' },
  { id: THEME_PRESETS.SILVER_METALLIC, name: 'Silver Metallic', description: 'Ultra-sleek metallic chrome text', badge: 'Chrome', primaryColor: '#F8FAFC', highlightColor: '#94A3B8', fontFamily: 'Cinzel', animation: 'slide_up' },
  { id: THEME_PRESETS.CINEMATIC_SERIF, name: 'Cinematic Serif', description: 'Elegant Playfair Display for documentaries', badge: 'Film', primaryColor: '#FFFFFF', highlightColor: '#F59E0B', fontFamily: 'Playfair Display', animation: 'streaming' },
  { id: THEME_PRESETS.PASTEL_LAVENDER, name: 'Pastel Lavender', description: 'Soft aesthetic lavender for lifestyle reels', badge: 'Pastel', primaryColor: '#FFFFFF', highlightColor: '#C084FC', fontFamily: 'Outfit', animation: 'floating' },
  { id: THEME_PRESETS.PASTEL_PEACH, name: 'Pastel Peach', description: 'Warm soft peach highlight for beauty vlogs', badge: 'Beauty', primaryColor: '#FFFFFF', highlightColor: '#FDBA74', fontFamily: 'Poppins', animation: 'floating' },
  { id: THEME_PRESETS.CHALK_WHITE, name: 'Chalkboard White', description: 'Handwritten chalk texture look', badge: 'Educate', primaryColor: '#FFFFFF', highlightColor: '#FACC15', fontFamily: 'Caveat', animation: 'typewriter' },
  { id: THEME_PRESETS.SLATE_MINIMAL, name: 'Slate Gray Minimal', description: 'Minimalist dark slate subtitle style', badge: 'Clean', primaryColor: '#E2E8F0', highlightColor: '#38BDF8', fontFamily: 'Inter', animation: 'slide_down' },

  // 5. Gaming, Anime & Retro Tech
  { id: THEME_PRESETS.VHS_GLITCH, name: '90s Retro VHS', description: 'Retro 80s VHS tape glitch aesthetic', badge: 'Retro', primaryColor: '#FFFFFF', highlightColor: '#06B6D4', fontFamily: 'Orbitron', animation: 'chromatic_glitch' },
  { id: THEME_PRESETS.RETRO_PIXEL, name: '8-Bit Arcade Pixel', description: 'Nostalgic arcade game text style', badge: 'Arcade', primaryColor: '#FFFFFF', highlightColor: '#22C55E', fontFamily: 'Press Start 2P', animation: 'typewriter' },
  { id: THEME_PRESETS.ANIME_SHOUT, name: 'Anime Action Shout', description: 'High-contrast dynamic Japanese anime style', badge: 'Anime', primaryColor: '#FFFFFF', highlightColor: '#EF4444', fontFamily: 'Bangers', animation: 'shake_rumble' },
  { id: THEME_PRESETS.CYBER_PUNK_2077, name: 'Cyberpunk 2077', description: 'High voltage yellow & dark glitch style', badge: 'Cyber', primaryColor: '#FACC15', highlightColor: '#06B6D4', fontFamily: 'Orbitron', animation: 'chromatic_glitch' },
  { id: THEME_PRESETS.DARK_VADER, name: 'Sith Red Dark', description: 'Dark crimson red shadow aura', badge: 'Dark', primaryColor: '#FFFFFF', highlightColor: '#DC2626', fontFamily: 'Black Ops One', animation: 'shake_rumble' },

  // 6. Regional Indian Creator Presets
  { id: THEME_PRESETS.DESI_YATRA, name: 'Yatra Devanagari Bold', description: 'High-impact Yatra Devanagari for Hindi shorts', badge: '🇮🇳 Hindi', primaryColor: '#FFFFFF', highlightColor: '#FACC15', fontFamily: 'Yatra One', animation: 'pop' },
  { id: THEME_PRESETS.TELUGU_RAMA, name: 'Ramabhadra Telugu Bold', description: 'Ultra-legible Ramabhadra for Telugu reels', badge: '🇮🇳 Telugu', primaryColor: '#FFFFFF', highlightColor: '#22C55E', fontFamily: 'Ramabhadra', animation: 'bounce' },
  { id: THEME_PRESETS.BOLLYWOOD_GOLD, name: 'Bollywood Gold Sparkle', description: 'Shining gold headline for cinema content', badge: '🇮🇳 Gold', primaryColor: '#FFFFFF', highlightColor: '#EAB308', fontFamily: 'Rozha One', animation: 'glow_pulse' },
  { id: THEME_PRESETS.SOUTH_ACTION, name: 'South Cinema Action', description: 'High-intensity red & gold action preset', badge: '🇮🇳 Action', primaryColor: '#FFFFFF', highlightColor: '#EF4444', fontFamily: 'Teko', animation: 'shake_rumble' },
  { id: THEME_PRESETS.HINDI_TEKO, name: 'Teko Hindi Shorts', description: 'Modern condensed Teko font for viral shorts', badge: '🇮🇳 Shorts', primaryColor: '#FFFFFF', highlightColor: '#06B6D4', fontFamily: 'Teko', animation: 'elastic_spring' },
  { id: THEME_PRESETS.MINIMAL_CLEAN, name: 'Minimal White', description: 'Clean studio typography, subtle shadow', badge: 'Minimal', primaryColor: '#F4F4F5', highlightColor: '#E4E4E7', fontFamily: 'Inter', animation: 'slide_up' },
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
    <div className="w-full bg-white/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar transition-colors">
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
      <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-1 text-[10px] font-bold">
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
          <div className="grid grid-cols-1 gap-2.5 animate-fadeIn">
            {PRESET_OPTIONS.map((preset) => {
              const isActive = currentPreset === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'border-yellow-500 dark:border-yellow-400 bg-yellow-500/10 dark:bg-yellow-400/10 shadow-lg shadow-yellow-500/10'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100/40 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {preset.name}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-yellow-500 dark:bg-yellow-400 text-black'
                          : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                    {preset.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Typography Controls Header with Collapse Toggle */}
      <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-4">
        <button
          type="button"
          onClick={() => setIsTypographyCollapsed(!isTypographyCollapsed)}
          className="w-full flex items-center justify-between group cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Type className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
              Typography Controls (50+ Google Fonts)
            </h4>
          </span>
          {isTypographyCollapsed ? (
            <ChevronDown className="w-4 h-4 text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white transition" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white transition" />
          )}
        </button>

        {!isTypographyCollapsed && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block mb-1.5">
                Font Family (50+ Styles)
              </label>
              <CustomFontSelect
                value={timeline.globalTheme?.fontFamily || 'Inter'}
                onChange={(font) => handleGlobalThemeChange('fontFamily', font)}
                categories={FONT_CATEGORIES}
              />

              <button
                type="button"
                onClick={() => setShowFontPicker(true)}
                className="mt-2 w-full py-2 px-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 font-bold text-xs hover:bg-yellow-500/20 transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Browse 70+ Fonts Studio (Live Script Previews)</span>
              </button>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                  Subtitle Pacing (Words per line)
                </label>
                <span className="text-[11px] font-mono font-bold text-yellow-600 dark:text-yellow-400">
                  {timeline.globalTheme?.maxWordsPerLine || 3} words
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleGlobalThemeChange('maxWordsPerLine', num)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                      (timeline.globalTheme?.maxWordsPerLine || 3) === num
                        ? 'border-yellow-500 dark:border-yellow-400 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                        : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {num === 1 ? '1 Word' : `${num} Words`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                  Font Size ({timeline.globalTheme?.fontSize || 52}px)
                </label>
              </div>
              <input
                type="range"
                min="30"
                max="90"
                value={timeline.globalTheme?.fontSize || 52}
                onChange={(e) => handleGlobalThemeChange('fontSize', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 accent-yellow-500 dark:accent-yellow-400 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                  <Move className="w-3 h-3 text-slate-400 dark:text-zinc-400" /> Position Y (
                  {timeline.segments?.[0]?.position?.y || 75}%)
                </label>
              </div>
              <input
                type="range"
                min="20"
                max="85"
                value={timeline.segments?.[0]?.position?.y || 75}
                onChange={(e) => handlePositionChange(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 accent-yellow-500 dark:accent-yellow-400 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

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
