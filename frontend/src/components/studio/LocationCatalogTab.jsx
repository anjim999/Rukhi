import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { uploadStudioAsset, generateLocationCandidates } from '../../services/studioService';

const SAMPLE_LOCATION_PRESETS = [
  { label: 'Modern Villa', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80' },
  { label: 'Tech Office', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80' },
  { label: 'Coffee Shop', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80' },
  { label: 'Night Street', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80' }
];

export default function LocationCatalogTab({
  selectedSeries,
  locations = [],
  onCreateLocation,
  onUpdateLocation,
  onDeleteLocation,
  onBulkDeleteLocations
}) {
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [locationType, setLocationType] = useState('Interior');
  const [lightingPreset, setLightingPreset] = useState('Blue Hour Mood');
  const [architectureDescription, setArchitectureDescription] = useState('');
  const [ambientDecorNotes, setAmbientDecorNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [referenceImages, setReferenceImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  // AI Candidate Generator State
  const [aiPrompt, setAiPrompt] = useState('Modern luxury Villa living room with warm tungsten lamps and rain windows');
  const [candidates, setCandidates] = useState([]);
  const [generatingCandidates, setGeneratingCandidates] = useState(false);

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Dashboard-style Select Mode State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal States
  const [deleteModal, setDeleteModal] = useState({ open: false, type: 'single', id: null, name: '' });
  const [editConfirmModal, setEditConfirmModal] = useState({ open: false, payload: null });

  // Lock Body Scroll when any Modal is open
  const isAnyModalOpen = showFormModal || deleteModal.open || editConfirmModal.open;
  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAnyModalOpen]);

  // Open Form for Adding New Location
  const handleOpenAddForm = () => {
    setEditingId(null);
    setName('');
    setLocationType('Interior');
    setLightingPreset('Blue Hour Mood');
    setArchitectureDescription('Modern luxury Villa A living room, marble tiles, floor-to-ceiling glass balcony windows with rain streaks, velvet dark sofa');
    setAmbientDecorNotes('Coffee table with broken photo frame, warm tungsten lamps, soft room acoustics');
    setReferenceImages([
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80'
    ]);
    setShowFormModal(true);
  };

  // Open Form for Editing Existing Location
  const handleEditClick = (loc) => {
    setEditingId(loc.id);
    setName(loc.name || '');
    setLocationType(loc.location_type || 'Interior');
    setLightingPreset(loc.lighting_preset || 'Blue Hour Mood');
    setReferenceImages(loc.reference_images || []);
    const env = loc.environment_specs || {};
    setArchitectureDescription(env.architecture || '');
    setAmbientDecorNotes(env.ambientProps || '');
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingId(null);
  };

  // Toggle Select Mode / Select All button
  const filteredLocations = locations.filter((l) =>
    (l.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.location_type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAllSelected = filteredLocations.length > 0 && selectedIds.size === filteredLocations.length;

  const handleSelectButtonClick = () => {
    if (!isSelectMode) {
      setIsSelectMode(true);
    } else {
      if (isAllSelected) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(filteredLocations.map((l) => l.id)));
      }
    }
  };

  const cancelSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Trigger Bulk Delete Modal
  const handleBulkDeletePrompt = () => {
    if (selectedIds.size === 0) return;
    setDeleteModal({ open: true, type: 'bulk', id: null, name: `${selectedIds.size} set locations` });
  };

  // Trigger Single Delete Modal
  const handleSingleDeletePrompt = (id, locName) => {
    setDeleteModal({ open: true, type: 'single', id, name: locName });
  };

  // Confirm Delete Handler
  const confirmDelete = () => {
    if (deleteModal.type === 'bulk') {
      onBulkDeleteLocations(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectMode(false);
    } else if (deleteModal.type === 'single' && deleteModal.id) {
      onDeleteLocation(deleteModal.id);
      const next = new Set(selectedIds);
      next.delete(deleteModal.id);
      setSelectedIds(next);
    }
    setDeleteModal({ open: false, type: 'single', id: null, name: '' });
  };

  const handleGenerateCandidates = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingCandidates(true);
    try {
      const res = await generateLocationCandidates(aiPrompt.trim());
      const cList = res.data?.candidates || res.candidates || [];
      setCandidates(cList);
    } catch (err) {
      alert('Failed to generate AI set location candidates: ' + err.message);
    } finally {
      setGeneratingCandidates(false);
    }
  };

  const handleLockCandidate = (url) => {
    if (!referenceImages.includes(url)) {
      setReferenceImages([url, ...referenceImages]);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadStudioAsset(file);
      const uploadedUrl = res.data?.url || res.url;
      if (uploadedUrl) {
        setReferenceImages([...referenceImages, uploadedUrl]);
      }
    } catch (err) {
      alert('Failed to upload image asset: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddPreset = (url) => {
    if (!referenceImages.includes(url)) {
      setReferenceImages([...referenceImages, url]);
    }
  };

  const handleAddImage = () => {
    if (!imageUrl.trim()) return;
    setReferenceImages([...referenceImages, imageUrl.trim()]);
    setImageUrl('');
  };

  const handleRemoveImage = (index) => {
    setReferenceImages(referenceImages.filter((_, i) => i !== index));
  };

  const handleSubmitLocation = (e) => {
    e.preventDefault();
    if (!selectedSeries) {
      alert('Please select an active Series Bible first!');
      return;
    }
    if (!name.trim()) return;

    const payload = {
      seriesId: selectedSeries.id,
      name,
      locationType,
      referenceImages,
      lightingPreset,
      environmentSpecs: {
        architecture: architectureDescription,
        ambientProps: ambientDecorNotes,
        acoustics: 'Soft Room Reverberation',
        timeOfDay: lightingPreset
      }
    };

    if (editingId) {
      setEditConfirmModal({ open: true, payload });
    } else {
      onCreateLocation(payload);
      setShowFormModal(false);
      setName('');
    }
  };

  const confirmEditSave = () => {
    if (editingId && editConfirmModal.payload) {
      onUpdateLocation(editingId, editConfirmModal.payload);
      setEditingId(null);
      setShowFormModal(false);
      setName('');
    }
    setEditConfirmModal({ open: false, payload: null });
  };

  return (
    <div className="space-y-6 text-white max-w-7xl mx-auto animate-fadeIn relative">
      {!selectedSeries ? (
        <div className="bg-slate-950/90 border border-emerald-500/30 rounded-3xl p-8 text-center backdrop-blur-2xl shadow-2xl">
          <p className="text-slate-400 font-medium">Please select an active Series Bible from the Series Bible tab to manage film set locations.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Catalog Action Bar */}
          <div className="bg-slate-950/90 border border-emerald-500/30 rounded-3xl p-5 backdrop-blur-2xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-black shadow-md">
                🏰
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white">Set Location Catalog</h3>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                    {locations.length} Film Sets
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Series: <strong className="text-emerald-400">{selectedSeries.title}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                placeholder="Search set location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 w-44 sm:w-56"
              />

              {locations.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectButtonClick}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  {isSelectMode && (
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      readOnly
                      className="w-3.5 h-3.5 rounded border-slate-700 accent-emerald-500 cursor-pointer"
                    />
                  )}
                  <span>
                    {!isSelectMode
                      ? 'Select'
                      : isAllSelected
                      ? 'Deselect All'
                      : 'Select All'}
                  </span>
                </button>
              )}

              {isSelectMode && (
                <button
                  type="button"
                  onClick={cancelSelectMode}
                  className="px-3 py-2 rounded-xl bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              )}

              {isSelectMode && selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleBulkDeletePrompt}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition active:scale-95 cursor-pointer animate-fadeIn"
                >
                  <span>🗑️</span> Delete ({selectedIds.size}) Selected
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenAddForm}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
              >
                <span>🏛️</span> + Add Set Location
              </button>
            </div>
          </div>

          {/* Full-Width Set Location Catalog Grid */}
          {filteredLocations.length === 0 ? (
            <div className="bg-slate-950/90 border border-slate-800/80 rounded-3xl p-12 text-center text-slate-400 space-y-3 shadow-xl">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-900 flex items-center justify-center text-3xl text-slate-500">
                🏛️
              </div>
              <p className="font-bold text-slate-300 text-sm">
                {searchQuery ? `No set locations match "${searchQuery}".` : `No set location assets registered yet for ${selectedSeries.title}.`}
              </p>
              <p className="text-xs text-slate-500">Click "+ Add Set Location" above to register your first film set!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLocations.map((loc) => {
                const isSelected = selectedIds.has(loc.id);
                return (
                  <div
                    key={loc.id}
                    className={`bg-slate-950/95 border-2 rounded-3xl p-5 backdrop-blur-2xl shadow-2xl transition-all space-y-4 group relative flex flex-col justify-between ${
                      isSelected ? 'border-emerald-400 bg-emerald-500/10' : 'border-emerald-500/30 hover:border-emerald-500/60'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5">
                        {isSelectMode && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(loc.id)}
                            className="rounded border-slate-700 accent-emerald-500 cursor-pointer w-4 h-4 shrink-0"
                          />
                        )}

                        <div className="h-40 flex-1 rounded-2xl bg-slate-900 border-2 border-emerald-500/40 overflow-hidden shadow-lg shadow-emerald-500/10">
                          {loc.reference_images?.[0] ? (
                            <img src={loc.reference_images[0]} alt={loc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">🏛️</div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-lg font-black text-white truncate">{loc.name}</h4>
                          <span className="text-xs bg-slate-900 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
                            {loc.location_type}
                          </span>
                        </div>

                        <p className="text-xs text-emerald-400 font-bold">
                          Lighting: {loc.lighting_preset}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 mt-2">
                      <span className="font-bold text-white">{(loc.reference_images || []).length} Keyframes</span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(loc)}
                          className="px-3 py-1 bg-slate-900 border border-slate-700 hover:border-emerald-400 text-emerald-300 font-extrabold rounded-xl transition-all text-xs cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSingleDeletePrompt(loc.id, loc.name)}
                          className="px-2.5 py-1 bg-red-950/60 border border-red-800 hover:bg-red-900 text-red-300 font-extrabold rounded-xl transition-all text-xs cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* React Portal Top-Level Form Modal (Clean Single-Container Internal Scrollbar) */}
      {showFormModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-[99999] p-4 sm:p-6 overflow-hidden animate-fadeIn">
          <div className="bg-slate-950 border-2 border-emerald-500/50 rounded-3xl p-6 max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header (Pinned Top) */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg font-black">
                  🏰
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-400 tracking-wide">
                    {editingId ? 'Edit Set Location' : 'Set Environment Studio'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Configure set architectural details & window lighting.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseFormModal}
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xl cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Scrollable Form Body (Internal Modal Scrollbar Only) */}
            <form onSubmit={handleSubmitLocation} className="flex-1 overflow-y-auto my-4 pr-2 space-y-5">
              {/* Row 1: Set Name, Type & Lighting */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">
                    Location / Set Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Villa A - Living Room"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors shadow-inner"
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">Set Type</label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Interior">Interior Set</option>
                    <option value="Exterior">Exterior Location</option>
                    <option value="Virtual Studio">Virtual Studio</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">Lighting Preset</label>
                  <select
                    value={lightingPreset}
                    onChange={(e) => setLightingPreset(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Blue Hour Mood">Blue Hour Mood</option>
                    <option value="Golden Hour Sunset">Golden Hour Sunset</option>
                    <option value="Neon Noir">Neon Noir</option>
                    <option value="Low-Key Shadows">Low-Key Shadows</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Architectural Details & Room Environment DNA */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black text-emerald-400 uppercase tracking-wider">
                    🏛️ Architectural Details & Set Environment DNA *
                  </label>
                  <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                    Set Locked
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={architectureDescription}
                  onChange={(e) => setArchitectureDescription(e.target.value)}
                  placeholder="Wall textures, flooring, furniture arrangement, window placement, lighting practicals..."
                  className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 leading-relaxed font-sans shadow-inner"
                />
              </div>

              {/* Row 3: Ambient Props & Sound Reverberation */}
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">
                  Ambient Props & Sound Reverberation
                </label>
                <textarea
                  rows={2}
                  value={ambientDecorNotes}
                  onChange={(e) => setAmbientDecorNotes(e.target.value)}
                  placeholder="Describe room props, background decor, and room acoustics..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Row 4: AI Candidate Generator (Imagen 3) */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>✨ AI Candidate Generator (Imagen 3)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">Human-in-the-Loop</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Describe set location atmosphere..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCandidates}
                    disabled={generatingCandidates}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black rounded-xl text-xs whitespace-nowrap transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    {generatingCandidates ? 'Generating...' : '✨ Generate'}
                  </button>
                </div>

                {candidates.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                    {candidates.map((cand) => (
                      <div key={cand.id} className="relative group rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-950 flex flex-col justify-between shadow-lg">
                        <div className="relative w-full h-36 bg-slate-900 overflow-hidden">
                          <img
                            src={cand.imageUrl}
                            alt={cand.label}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <span className="absolute top-1.5 left-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-700 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {cand.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleLockCandidate(cand.imageUrl)}
                          className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-md"
                        >
                          🔒 Lock Keyframe
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 5: Reference Keyframes */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                    Set Keyframe References ({referenceImages.length})
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SAMPLE_LOCATION_PRESETS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleAddPreset(preset.url)}
                        className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-300 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <label className="cursor-pointer px-4 py-2 bg-slate-950 border border-slate-700 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0">
                    <span>📁 Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    placeholder="Or paste image URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-2 bg-emerald-500 font-black text-slate-950 rounded-xl text-xs cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex gap-2.5 overflow-x-auto py-1">
                  {referenceImages.map((img, idx) => (
                    <div key={idx} className="relative group flex-shrink-0 w-16 h-12 rounded-xl border border-emerald-500/50 overflow-hidden shadow-md">
                      <img src={img} alt="ref" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute inset-0 bg-red-950/80 text-white font-black opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs transition-opacity cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SAVE / UPDATE BUTTON */}
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/25 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>🏛️</span> {editingId ? 'UPDATE SET LOCATION' : 'REGISTER FILM SET LOCATION ASSET'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && createPortal(
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-[99999] p-4 overflow-hidden animate-fadeIn">
          <div className="bg-slate-900 border-2 border-red-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 text-2xl font-black">
                🗑️
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Delete Set Confirmation</h4>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-red-400 font-bold">{deleteModal.name}</strong>? All lighting specs and reference keyframes will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, type: 'single', id: null, name: '' })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Save Confirmation Modal */}
      {editConfirmModal.open && createPortal(
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-[99999] p-4 overflow-hidden animate-fadeIn">
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl font-black">
                ✏️
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Update Set Location</h4>
                <p className="text-xs text-slate-400">Save changes to environment DNA.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Save updated specs for <strong className="text-emerald-400 font-bold">{editConfirmModal.payload?.name}</strong>? Rukhi Film Engine will update lighting & acoustic continuity for future scenes.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditConfirmModal({ open: false, payload: null })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEditSave}
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/30 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
