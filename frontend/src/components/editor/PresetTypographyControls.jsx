import React from 'react';
import { Type, Sparkles, Move, ChevronDown, ChevronUp } from 'lucide-react';
import CustomFontSelect from './CustomFontSelect';

export default function PresetTypographyControls({
  isTypographyCollapsed,
  setIsTypographyCollapsed,
  timeline,
  handleGlobalThemeChange,
  handlePositionChange,
  FONT_CATEGORIES,
  setShowFontPicker,
}) {
  return (
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
              className="mt-2 w-full py-2 px-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 font-bold text-xs hover:bg-yellow-500/20 transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
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
                  className={`py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
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
  );
}
