import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export default function CustomFontSelect({ value, onChange, categories, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 280 });
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  // Update popup position when open or on scroll/resize
  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = Math.max(rect.width, 280);
      const spaceBelow = window.innerHeight - rect.bottom;

      let top = rect.bottom + 6;
      // If near bottom of screen, show above button
      if (spaceBelow < 320 && rect.top > 320) {
        top = rect.top - 326;
      }

      setCoords({
        top: Math.max(10, top),
        left: Math.min(Math.max(10, rect.left), window.innerWidth - popoverWidth - 10),
        width: popoverWidth,
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollResize = () => updateCoords();
    const handleClickOutside = (e) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('scroll', handleScrollResize, true);
    window.addEventListener('resize', handleScrollResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollResize, true);
      window.removeEventListener('resize', handleScrollResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedFont = value || 'Inter';

  return (
    <div className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-500/40 focus:border-yellow-500 transition-all cursor-pointer"
      >
        <span style={{ fontFamily: selectedFont }} className="truncate">
          {selectedFont}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-zinc-500 transition-transform ${isOpen ? 'rotate-180 text-yellow-500' : ''}`} />
      </button>

      {/* Render Open Popover Dropdown Portal outside clipped containers directly on document.body */}
      {isOpen &&
        ReactDOM.createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999,
            }}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-80 flex flex-col animate-fadeIn p-2 space-y-2"
          >
            {/* Quick Search inside popover */}
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search font..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-yellow-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Scrollable Font Categories & Rendered Names */}
            <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2.5 pr-0.5">
              {categories.map((category) => {
                const matchingFonts = category.fonts.filter((f) =>
                  f.toLowerCase().includes(searchQuery.toLowerCase().trim())
                );
                if (matchingFonts.length === 0) return null;

                return (
                  <div key={category.label} className="space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 dark:bg-yellow-500/10 rounded-lg">
                      {category.label}
                    </div>

                    <div className="space-y-0.5">
                      {matchingFonts.map((font) => {
                        const isSelected = selectedFont === font;
                        return (
                          <button
                            key={font}
                            type="button"
                            onClick={() => {
                              onChange(font);
                              setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20 font-black'
                                : 'text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <span style={{ fontFamily: font }} className="truncate">
                              {font}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-black shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
