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
  STREAMING: 'streaming',
  KARAOKE_SWEEP: 'karaoke_sweep',
  TYPEWRITER: 'typewriter',
  ELASTIC_SPRING: 'elastic_spring',
  CHROMATIC_GLITCH: 'chromatic_glitch',
  ZOOM_IN: 'zoom_in',
  ZOOM_OUT: 'zoom_out',
  SLIDE_UP: 'slide_up',
  SLIDE_DOWN: 'slide_down',
  SLIDE_LEFT: 'slide_left',
  SLIDE_RIGHT: 'slide_right',
  SPIN_REVEAL: 'spin_reveal',
  FLIP_ROTATE: 'flip_rotate',
  NEON_AURA: 'neon_aura',
  SHAKE_RUMBLE: 'shake_rumble',
  FLOATING: 'floating',
  WAVE: 'wave',
  GLOW_PULSE: 'glow_pulse',
  SINGLE_FLASH: 'single_flash',
  EXPAND_BLUR: 'expand_blur',
  SPIRAL_IN: 'spiral_in',
  DROP_BOUNCE: 'drop_bounce',
  HEARTBEAT: 'heartbeat',
  RUBBER_BAND: 'rubber_band',
  SWING_PENDULUM: 'swing_pendulum',
  JELLO_WOBBLE: 'jello_wobble',
  FADE_GLIDE: 'fade_glide',
  OVERSHOOT_SCALE: 'overshoot_scale',
  SKEDADDLE: 'skedaddle',
  ORBIT_ROTATION: 'orbit_rotation',
  LIGHT_BEAM: 'light_beam',
  DUAL_BOUNCE: 'dual_bounce',
  FLOAT_UP: 'float_up',
  SLANTED_SHAKE: 'slanted_shake',
  PULSE_ZOOM: 'pulse_zoom',
  SPLIT_FLIP: 'split_flip',
  WOBBLE_TOP: 'wobble_top',
  SPRING_REBOUND: 'spring_rebound',
  MAGNIFY_POP: 'magnify_pop',
  STAGGER_DROP: 'stagger_drop',
  RIPPLE_WAVE: 'ripple_wave',
  SHADOW_BURST: 'shadow_burst',
  SHUTTER_SNAP: 'shutter_snap',
  ELEVATOR_RISE: 'elevator_rise',
  CYBER_PULSE: 'cyber_pulse',
  TILT_SWAY: 'tilt_sway',
  BOUNCE_IN_UP: 'bounce_in_up',
  FLICKER_GLOW: 'flicker_glow',
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
  // 1. Viral Creator & Influencer Boxes
  VIRAL_SCRIPT_HYBRID: 'viral_script_hybrid',
  BOLD_VIRAL: 'bold_viral',
  HORMOZI: 'hormozi',
  HORMOZI_YELLOW: 'hormozi_yellow',
  HORMOZI_RED: 'hormozi_red',
  MRBEAST_PUNCH: 'mrbeast_punch',
  GADZHI_MINIMAL: 'gadzhi_minimal',
  SUBMAGIC_GLOW: 'submagic_glow',
  ALI_ABDAAL: 'ali_abdaal',
  DEV_INFLUENCER: 'dev_influencer',

  // 2. High-Energy Neon & Cyberpunk Auras
  NEON_GLOW: 'neon_glow',
  CYBER_PURPLE: 'cyber_purple',
  MATRIX_GREEN: 'matrix_green',
  ICE_BLUE: 'ice_blue',
  AMBER_GLOW: 'amber_glow',
  RUBY_GLOW: 'ruby_glow',
  NEON_LEMON: 'neon_lemon',
  ROSE_GOLD: 'rose_gold',
  NEON_ORANGE: 'neon_orange',
  NEON_LIME: 'neon_lime',

  // 3. Pop Art & Comic Active Box Styles
  COMIC_YELLOW: 'comic_yellow',
  FIRE_RED: 'fire_red',
  ELECTRIC_CYAN: 'electric_cyan',
  ELECTRIC_LIME: 'electric_lime',
  VIOLET_DREAM: 'violet_dream',
  HOT_PINK: 'hot_pink',
  ROYAL_BLUE: 'royal_blue',
  TEAL_BREEZE: 'teal_breeze',
  TANGERINE_POP: 'tangerine_pop',
  INDIGO_SKY: 'indigo_sky',
  MINT_FRESH: 'mint_fresh',
  CORAL_CRUSH: 'coral_crush',
  SUNSET_BURST: 'sunset_burst',

  // 4. Luxury, Podcast & Aesthetic Vlogs
  GOLD_LUXURY: 'gold_luxury',
  SILVER_METALLIC: 'silver_metallic',
  CINEMATIC_SERIF: 'cinematic_serif',
  PASTEL_LAVENDER: 'pastel_lavender',
  PASTEL_PEACH: 'pastel_peach',
  CHALK_WHITE: 'chalk_white',
  SLATE_MINIMAL: 'slate_minimal',

  // 5. Gaming, Anime & Retro Tech
  VHS_GLITCH: 'vhs_glitch',
  RETRO_PIXEL: 'retro_pixel',
  ANIME_SHOUT: 'anime_shout',
  CYBER_PUNK_2077: 'cyber_punk_2077',
  DARK_VADER: 'dark_vader',

  // 6. Regional Indian Creator Presets (Telugu, Hindi, Devanagari)
  DESI_YATRA: 'desi_yatra',
  TELUGU_RAMA: 'telugu_rama',
  BOLLYWOOD_GOLD: 'bollywood_gold',
  SOUTH_ACTION: 'south_action',
  HINDI_TEKO: 'hindi_teko',
  MINIMAL_CLEAN: 'minimal_clean',

  CUSTOM: 'custom',
});

export const PROJECT_STATUSES = Object.freeze({
  PENDING: 'pending',
  EXTRACTING_AUDIO: 'extracting_audio',
  TRANSCRIBING: 'transcribing',
  ANALYZING: 'analyzing',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
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
      fontSize: 52,
      fontWeight: '900',
      primaryColor: '#FFFFFF',
      highlightColor: '#FACC15',
      presetName,
    },
  };
}
