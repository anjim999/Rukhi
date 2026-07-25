/**
 * Auto Captions Platform — Caption Timeline Schema
 * Standardized Caption Timeline JSON structure.
 */

export const DISPLAY_MODES = Object.freeze({
  SINGLE_WORD: 'single_word',
  CHUNK_2: 'chunk_2',
  CHUNK_3: 'chunk_3',
  LINE_BY_LINE: 'line_by_line',
});

export const ANIMATION_TYPES = Object.freeze({
  POP: 'pop',
  BOUNCE: 'bounce',
  SLIDE: 'slide',
  WAVE: 'wave',
  GLOW: 'glow',
  NONE: 'none',
});

export const SFX_TYPES = Object.freeze({
  WHOOSH: 'whoosh',
  POP: 'pop',
  CASH_REGISTER: 'cash_register',
  VINE_BOOM: 'vine_boom',
  NONE: 'none',
});

export const CASE_FORMATS = Object.freeze({
  UPPERCASE: 'uppercase',
  LOWERCASE: 'lowercase',
  ORIGINAL: 'original',
});

export const ASPECT_RATIOS = Object.freeze({
  PORTRAIT: '9:16',
  LANDSCAPE: '16:9',
  SQUARE: '1:1',
});

export const THEME_PRESETS = Object.freeze({
  BOLD_VIRAL: 'bold_viral',
  HORMOZI: 'hormozi',
  HORMOZI_YELLOW: 'hormozi_yellow',
  FIRE_RED: 'fire_red',
  ELECTRIC_CYAN: 'electric_cyan',
  NEON_GLOW: 'neon_glow',
  CYBER_PURPLE: 'cyber_purple',
  GOLD_LUXURY: 'gold_luxury',
  COMIC_YELLOW: 'comic_yellow',
  SUNSET_ORANGE: 'sunset_orange',
  ELECTRIC_LIME: 'electric_lime',
  VIOLET_DREAM: 'violet_dream',
  VHS_GLITCH: 'vhs_glitch',
  MATRIX_GREEN: 'matrix_green',
  ICE_BLUE: 'ice_blue',
  HOT_PINK: 'hot_pink',
  AMBER_GLOW: 'amber_glow',
  EMERALD_SHINE: 'emerald_shine',
  CRIMSON_DARK: 'crimson_dark',
  ROYAL_BLUE: 'royal_blue',
  CHALK_WHITE: 'chalk_white',
  SLATE_MINIMAL: 'slate_minimal',
  NEON_LEMON: 'neon_lemon',
  RUBY_GLOW: 'ruby_glow',
  TEAL_BREEZE: 'teal_breeze',
  TANGERINE_POP: 'tangerine_pop',
  INDIGO_SKY: 'indigo_sky',
  ROSE_GOLD: 'rose_gold',
  MINT_FRESH: 'mint_fresh',
  MINIMAL_CLEAN: 'minimal_clean',
  CUSTOM: 'custom',
});

export const PROJECT_STATUSES = Object.freeze({
  PENDING: 'pending',
  EXTRACTING_AUDIO: 'extracting_audio',
  TRANSCRIBING: 'transcribing',
  ANALYZING: 'analyzing',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

export const EXPORT_STATUSES = Object.freeze({
  QUEUED: 'queued',
  RENDERING: 'rendering',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

export function createEmptyTimeline(aspectRatio = ASPECT_RATIOS.PORTRAIT, presetName = THEME_PRESETS.BOLD_VIRAL) {
  return {
    version: '1.0',
    aspectRatio,
    stickyHook: null,
    segments: [],
    globalTheme: {
      fontFamily: 'Inter',
      fontSize: 48,
      fontWeight: '900',
      primaryColor: '#FFFFFF',
      highlightColor: '#FACC15',
      presetName,
    },
  };
}
