import { THEME_PRESETS } from '../../../../../shared/constants/timeline.js';

export const PRESET_OPTIONS = [
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
