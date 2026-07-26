import React, { useState, useMemo } from 'react';
import { Search, X, Check, Sparkles, Languages, Type } from 'lucide-react';

const FONT_DATA = [
  // 🇬🇧 English / Universal Sans & Serif
  { name: 'Inter', category: 'english', label: 'English Sans', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Montserrat', category: 'english', label: 'English Bold', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Outfit', category: 'english', label: 'English Modern', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Roboto', category: 'english', label: 'English Clean', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Poppins', category: 'english', label: 'English Geometry', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Oswald', category: 'english', label: 'English Tall', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Bebas Neue', category: 'english', label: 'English Impact', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Anton', category: 'english', label: 'English Heavy', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Playfair Display', category: 'english', label: 'English Serif', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Space Grotesk', category: 'english', label: 'English Tech', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Syne', category: 'english', label: 'English Trendy', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Kanit', category: 'english', label: 'English Heavy', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Rubik Glitch', category: 'english', label: 'Glitch Style', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Cinzel', category: 'english', label: 'Luxury Serif', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Righteous', category: 'english', label: 'Retro Pop', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Fredoka', category: 'english', label: 'Round Pop', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Staatliches', category: 'english', label: 'Poster Bold', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Russo One', category: 'english', label: 'Block Heavy', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Ultra', category: 'english', label: 'Ultra Heavy', sample: 'VIRAL CAPTION SYNC' },
  { name: 'Black Ops One', category: 'english', label: 'Army Bold', sample: 'VIRAL CAPTION SYNC' },

  // 🇮🇳 Hindi (Devanagari) Fonts
  { name: 'Yatra One', category: 'hindi', label: 'Hindi Headline', sample: 'सबटाइटल फ़ॉन्ट पूर्वावलोकन' },
  { name: 'Rozha One', category: 'hindi', label: 'Hindi Heavy', sample: 'सबटाइटल फ़ॉन्ट पूर्वावलोकन' },
  { name: 'Hind', category: 'hindi', label: 'Hindi Modern', sample: 'सबटाइटल फ़ॉन्ट पूर्वावलोकन' },
  { name: 'Teko', category: 'hindi', label: 'Hindi Tall', sample: 'सबटाइटल फ़ॉन्ट पूर्वावलोकन' },
  { name: 'Mukta', category: 'hindi', label: 'Hindi Bold', sample: 'सबटाइटल फ़ॉन्ट पूर्वावलोकन' },
  { name: 'Gotu', category: 'hindi', label: 'Hindi Rounded', sample: 'सबटाइटल फ़ॉन्ट पूर्वावलोकन' },
  { name: 'Modak', category: 'hindi', label: 'Hindi Chunky', sample: 'सबटाइटल फ़ॉन्ट पूर्वावलोकन' },
  { name: 'Rajdhani', category: 'hindi', label: 'Hindi Tech', sample: 'सबटाइटल फ़ॉन्ट पूर्वावलोकन' },
  { name: 'Kalam', category: 'hindi', label: 'Hindi Script', sample: 'सबटाइटल फ़ॉन्ट पूर्वावलोकन' },
  { name: 'Amita', category: 'hindi', label: 'Hindi Elegant', sample: 'सबटाइटल फ़ॉन्ट पूर्वावलोकन' },
  { name: 'Eczar', category: 'hindi', label: 'Hindi Serif', sample: 'सबटाइटल फ़ॉन्ट पूर्वावलोकन' },
  { name: 'Karma', category: 'hindi', label: 'Hindi Classic', sample: 'सबटाइटल फ़ॉन्ट पूर्वावलोकन' },
  { name: 'Martel', category: 'hindi', label: 'Hindi Strong', sample: 'सबटाइटल फ़ॉन्ट पूर्वावलोकन' },
  { name: 'Ranga', category: 'hindi', label: 'Hindi Casual', sample: 'सबटाइटल फ़ॉन्ट पूर्वावलोकन' },
  { name: 'Sarala', category: 'hindi', label: 'Hindi Clean', sample: 'सबटाइटल फ़ॉन्ट पूर्वावलोकन' },
  { name: 'Tillana', category: 'hindi', label: 'Hindi Decorative', sample: 'सबटाइटल फ़ॉन्ट पूर्वावलोकन' },
  { name: 'Vesper Libre', category: 'hindi', label: 'Hindi Literary', sample: 'सबटाइटल फ़ॉन्ट पूर्वावलोकन' },

  // 🇮🇳 Telugu Fonts
  { name: 'Ramabhadra', category: 'telugu', label: 'Telugu Headline', sample: 'సబ్‌టైటిల్ ఫాంట్ నమూనా' },
  { name: 'Gidugu', category: 'telugu', label: 'Telugu Modern', sample: 'సబ్‌టైటిల్ ఫాంట్ నమూనా' },
  { name: 'NTR', category: 'telugu', label: 'Telugu Clean', sample: 'సబ్‌టైటిల్ ఫాంట్ నమూనా' },
  { name: 'Suranna', category: 'telugu', label: 'Telugu Classic', sample: 'సబ్‌టైటిల్ ఫాంట్ నమూనా' },
  { name: 'Lakki Reddy', category: 'telugu', label: 'Telugu Bold', sample: 'సబ్‌టైటిల్ ఫాంట్ నమూనా' },
  { name: 'Peddana', category: 'telugu', label: 'Telugu Traditional', sample: 'సబ్‌టైటిల్ ఫాంట్ నమూనా' },
  { name: 'Chathura', category: 'telugu', label: 'Telugu Condensed', sample: 'సబ్‌టైటిల్ ఫాంట్ నమూనా' },
  { name: 'Ponnala', category: 'telugu', label: 'Telugu Rounded', sample: 'సబ్‌టైటిల్ ఫాంట్ నమూనా' },
  { name: 'Dhurjati', category: 'telugu', label: 'Telugu Script', sample: 'సబ్‌టైటిల్ ఫాంట్ నమూనా' },
  { name: 'Gurajada', category: 'telugu', label: 'Telugu Literary', sample: 'సబ్‌టైటిల్ ఫాంట్ నమూనా' },
  { name: 'Mallanna', category: 'telugu', label: 'Telugu Strong', sample: 'సబ్‌టైటిల్ ఫాంట్ నమూనా' },
  { name: 'Ravi Prakash', category: 'telugu', label: 'Telugu Headline', sample: 'సబ్‌టైటిల్ ఫాంట్ నమూనా' },
  { name: 'Tenali Ramakrishna', category: 'telugu', label: 'Telugu Classic', sample: 'సబ్‌టైటిల్ ఫాంట్ నమూనా' },
  { name: 'Sree Krushnadevaraya', category: 'telugu', label: 'Telugu Heritage', sample: 'సబ్‌టైటిల్ ఫాంట్ నమూనా' },
  { name: 'Timmana', category: 'telugu', label: 'Telugu Artistic', sample: 'సబ్‌టైటిల్ ఫాంట్ నమూనా' },

  // ✨ Display & Kinetic Styles
  { name: 'Pacifico', category: 'display', label: 'Brush Script', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Dancing Script', category: 'display', label: 'Cursive Script', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Caveat', category: 'display', label: 'Handwritten', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Great Vibes', category: 'display', label: 'Calligraphy', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Satisfy', category: 'display', label: 'Smooth Cursive', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Lobster', category: 'display', label: 'Retro Script', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Permanent Marker', category: 'display', label: 'Marker Pen', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Abril Fatface', category: 'display', label: 'Vogue Display', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Bungee', category: 'display', label: 'Urban Block', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Press Start 2P', category: 'display', label: '8-Bit Arcade', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Cinzel Decorative', category: 'display', label: 'Luxury Ornate', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Marck Script', category: 'display', label: 'Elegant Cursive', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Sacramento', category: 'display', label: 'Retro Thin Script', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Yellowtail', category: 'display', label: 'Vintage Brush', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Alex Brush', category: 'display', label: 'Soft Script', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Parisienne', category: 'display', label: 'French Glam', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Shadows Into Light', category: 'display', label: 'Neat Handwriting', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Indie Flower', category: 'display', label: 'Doodle Casual', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Amatic SC', category: 'display', label: 'Tall Condensed', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Chewy', category: 'display', label: 'Bubble Comic', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Luckiest Guy', category: 'display', label: 'Viral Cartoon', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Bangers', category: 'display', label: 'Comic Book', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Special Elite', category: 'display', label: 'Typewriter', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Orbitron', category: 'display', label: 'Sci-Fi Future', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Shrikhand', category: 'display', label: 'Retro 70s', sample: 'STYLISH KINETIC CAPTION' },
  { name: 'Changa One', category: 'display', label: 'Heavy Display', sample: 'STYLISH KINETIC CAPTION' },
];

const CATEGORY_TABS = [
  { id: 'all', label: 'All 70+ Fonts', icon: Type },
  { id: 'english', label: '🇬🇧 English', icon: Languages },
  { id: 'hindi', label: '🇮🇳 Hindi (हिंदी)', icon: Languages },
  { id: 'telugu', label: '🇮🇳 Telugu (తెలుగు)', icon: Languages },
  { id: 'display', label: '✨ Display & Kinetic', icon: Sparkles },
];

export default function FontPickerModal({ isOpen, onClose, selectedFont, onSelectFont, title = 'Multilingual Font Studio' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredFonts = useMemo(() => {
    return FONT_DATA.filter((item) => {
      const matchesTab = activeTab === 'all' || item.category === activeTab;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.label.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Browse, preview, and select from 70+ native English, Hindi, and Telugu typography fonts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Language Category Filter Tabs */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 space-y-3 bg-slate-100/30 dark:bg-zinc-950/30">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search font by name (e.g. Yatra, Montserrat, Ramabhadra)..."
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700/80 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-yellow-500 dark:focus:border-yellow-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-yellow-500 text-black border-yellow-500 shadow-md shadow-yellow-500/20'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Cards Grid */}
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredFonts.length === 0 ? (
            <div className="col-span-full py-12 text-center space-y-2">
              <Type className="w-8 h-8 text-slate-400 dark:text-zinc-600 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">No matching fonts found</p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">Try searching for another name or switch categories</p>
            </div>
          ) : (
            filteredFonts.map((font) => {
              const isSelected = selectedFont === font.name;
              return (
                <div
                  key={font.name}
                  onClick={() => {
                    onSelectFont(font.name);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group ${
                    isSelected
                      ? 'border-yellow-500 dark:border-yellow-400 bg-yellow-500/10 dark:bg-yellow-400/10 shadow-lg shadow-yellow-500/10'
                      : 'border-slate-200 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-950/40 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100/60 dark:hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{font.name}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                        {font.label}
                      </span>
                      {isSelected && (
                        <span className="p-0.5 rounded-full bg-yellow-500 text-black">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Render Live Sample Text in Native Script & Font Family */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-center min-h-[52px]">
                    <span
                      style={{ fontFamily: font.name }}
                      className="text-base font-bold text-slate-900 dark:text-white tracking-wide truncate max-w-full"
                    >
                      {font.sample}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
