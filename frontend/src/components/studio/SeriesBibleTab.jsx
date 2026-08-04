import React, { useState } from 'react';
import { Film, Sparkles, BookOpen, Camera, Plus, Trash2, ShieldCheck } from 'lucide-react';

export default function SeriesBibleTab({ seriesList, selectedSeries, onSelectSeries, onCreateSeries }) {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Drama');
  const [ruleInput, setRuleInput] = useState('');
  const [canonRules, setCanonRules] = useState([
    'Rahul never shaves his beard',
    'Primary location setting is always Hyderabad',
    'Lighting tone is cinematic dark blue hour'
  ]);
  const [camera, setCamera] = useState('35mm Cinematic');

  const handleAddRule = () => {
    if (!ruleInput.trim()) return;
    setCanonRules([...canonRules, ruleInput.trim()]);
    setRuleInput('');
  };

  const handleRemoveRule = (index) => {
    setCanonRules(canonRules.filter((_, i) => i !== index));
  };

  const handleSubmitSeries = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateSeries({
      title,
      genre,
      canonRules,
      visualStyle: { camera, lighting: 'Natural Soft', lens: '50mm f/1.8' }
    });
    setTitle('');
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      {/* Series Selector & Creator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Series Picker */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-xl">
          <h3 className="text-lg font-semibold mb-4 text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <Film className="w-5 h-5" />
            <span>Select Series Bible</span>
          </h3>
          {seriesList.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No series created yet. Build your first fictional world!</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {seriesList.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelectSeries(s)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                    selectedSeries?.id === s.id
                      ? 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/50 text-amber-600 dark:text-amber-300 font-bold shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold text-base">{s.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between mt-1">
                    <span>Genre: {s.genre}</span>
                    <span>{(s.canon_rules || []).length} Rules</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Create New Series Bible */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-xl">
          <h3 className="text-lg font-semibold mb-4 text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span>Create New Series World</span>
          </h3>
          <form onSubmit={handleSubmitSeries} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Series Title</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul's Legacy (Season 1)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Genre / Style</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="Drama">Cinematic Drama</option>
                  <option value="Action">High-Octane Action</option>
                  <option value="Sci-Fi">Futuristic Sci-Fi</option>
                  <option value="Thriller">Psychological Thriller</option>
                  <option value="Romance">Romantic Feature</option>
                </select>
              </div>
            </div>

            {/* Canon Rules Editor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Canon World Rules & Constraints
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="e.g. Character X always drives a black SUV"
                  value={ruleInput}
                  onChange={(e) => setRuleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRule())}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 rounded-xl text-sm transition-all cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Add Rule
                </button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                {canonRules.map((rule, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    <span>📜 {rule}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="text-slate-400 hover:text-red-500 font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 transition-all text-sm uppercase tracking-wider cursor-pointer"
            >
              Initialize Series World Bible
            </button>
          </form>
        </div>
      </div>

      {/* Selected Series Overview Panel */}
      {selectedSeries && (
        <div className="bg-white dark:bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">Active World Bible</span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedSeries.title}</h2>
            </div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 rounded-full text-xs font-semibold">
              {selectedSeries.genre}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Canon Rules Enforcement</h4>
              <ul className="space-y-2">
                {(selectedSeries.canon_rules || []).map((rule, i) => (
                  <li key={i} className="text-sm bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="text-amber-500 dark:text-amber-400 font-bold">✓</span> {rule}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Cinematic Grammar</h4>
              <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs space-y-2 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-500">Camera Preset:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-300">{selectedSeries.visual_style?.camera || '35mm Cinematic'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-500">Lighting Tone:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedSeries.visual_style?.lighting || 'Natural Soft'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-500">Lens Framing:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedSeries.visual_style?.lens || '50mm f/1.8'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
