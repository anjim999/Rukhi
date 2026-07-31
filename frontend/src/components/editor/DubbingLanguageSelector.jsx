import React from 'react';
import { DUBBING_LANGUAGES as LANGUAGES } from './constants/dubbingLanguages';

export default function DubbingLanguageSelector({ targetLanguage, setTargetLanguage }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
        1. Target Output Language
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setTargetLanguage(lang.code)}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium transition-all cursor-pointer ${
              targetLanguage === lang.code
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-md shadow-indigo-500/10 scale-[1.02]'
                : 'bg-slate-850 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <span className="text-xl mb-1">{lang.flag}</span>
            <span className="truncate w-full text-center">{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
