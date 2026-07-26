import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select Option',
  className = '',
  buttonClassName = '',
  isUppercase = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 200 });
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  const selectedOption = options.find((opt) => opt.id === value);
  const displayText = selectedOption ? selectedOption.name : placeholder;

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = Math.max(rect.width, 220);
      const spaceBelow = window.innerHeight - rect.bottom;

      let top = rect.bottom + 6;
      if (spaceBelow < 260 && rect.top > 260) {
        top = rect.top - 266;
      }

      setCoords({
        top: Math.max(10, top),
        left: Math.min(Math.max(10, rect.left), window.innerWidth - popoverWidth - 10),
        width: popoverWidth,
      });
    }
  };

  const handleToggle = (e) => {
    e.stopPropagation();
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

  return (
    <div className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between gap-1.5 shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-500/40 focus:border-yellow-500 transition-all cursor-pointer truncate ${
          isUppercase ? 'uppercase' : ''
        } ${buttonClassName}`}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0 transition-transform ${
            isOpen ? 'rotate-180 text-yellow-500' : ''
          }`}
        />
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
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar animate-fadeIn p-1.5 space-y-1"
          >
            {/* Default / Clear Option if placeholder exists */}
            {placeholder && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  !value
                    ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30'
                    : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{placeholder}</span>
                {!value && <Check className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
              </button>
            )}

            {options.map((opt) => {
              const isSelected = value === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20 font-black'
                      : 'text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className={`truncate ${isUppercase ? 'uppercase' : ''}`}>{opt.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-black shrink-0" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
