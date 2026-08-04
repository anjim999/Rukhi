import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import {
  Building2, Landmark, MapPin, Sparkles, Lock, Eye, Pencil, Trash2,
  UploadCloud, Plus, X, Search, CheckSquare, Square, Sun, Moon
} from 'lucide-react';
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
  const [previewModalUrl, setPreviewModalUrl] = useState(null);

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Dashboard-style Select Mode State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal States
  const [deleteModal, setDeleteModal] = useState({ open: false, type: 'single', id: null, name: '' });
  const [editConfirmModal, setEditConfirmModal] = useState({ open: false, payload: null });
  const [viewCardModal, setViewCardModal] = useState(null);

  // Lock Body Scroll when any Modal is open
  const isAnyModalOpen = showFormModal || deleteModal.open || editConfirmModal.open || Boolean(viewCardModal);
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
    const toastId = toast.loading('Generating 3 AI set location candidate variations via Google Vertex AI ($300 Credits)...');
    console.log('[RUKHI STUDIO LOG] 🏛️ Generating AI set location candidates for prompt:', aiPrompt.trim());
    try {
      const res = await generateLocationCandidates(aiPrompt.trim());
      const cList = res.data?.candidates || res.candidates || [];
      setCandidates(cList);
      toast.success(`Generated ${cList.length} location candidate variations!`, { id: toastId });
      console.log('[RUKHI STUDIO LOG] ✅ Location candidates generated:', cList.length);
    } catch (err) {
      console.error('[RUKHI STUDIO ERROR] Location candidate generation error:', err);
      toast.error('Failed to generate AI set location candidates: ' + err.message, { id: toastId });
    } finally {
      setGeneratingCandidates(false);
    }
  };

  const handleLockCandidate = (url) => {
    if (!referenceImages.includes(url)) {
      setReferenceImages([url, ...referenceImages]);
      toast.success('🔒 Set keyframe locked!');
      console.log('[RUKHI STUDIO LOG] 🔒 Locked set keyframe:', url.substring(0, 50));
    } else {
      toast('Keyframe already in locked reference list', { icon: 'ℹ️' });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading('Uploading asset to Hostinger disk storage...');
    console.log('[RUKHI STUDIO LOG] 📁 Uploading location asset file:', file.name);
    try {
      const res = await uploadStudioAsset(file);
      const uploadedUrl = res.data?.url || res.url;
      if (uploadedUrl) {
        setReferenceImages([...referenceImages, uploadedUrl]);
        toast.success('Location asset uploaded!', { id: toastId });
        console.log('[RUKHI STUDIO LOG] ✅ Location asset uploaded:', uploadedUrl);
      }
    } catch (err) {
      console.error('[RUKHI STUDIO ERROR] Location asset upload error:', err);
      toast.error('Failed to upload image asset: ' + err.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleAddPreset = (url) => {
    if (!referenceImages.includes(url)) {
      setReferenceImages([...referenceImages, url]);
      toast.success('Added preset location keyframe');
    }
  };

  const handleAddImage = () => {
    if (!imageUrl.trim()) return;
    setReferenceImages([...referenceImages, imageUrl.trim()]);
    setImageUrl('');
    toast.success('Added location image URL');
  };

  const handleRemoveImage = (index) => {
    setReferenceImages(referenceImages.filter((_, i) => i !== index));
    toast('Removed location keyframe reference', { icon: '🗑️' });
  };

  const handleSubmitLocation = (e) => {
    e.preventDefault();
    if (!selectedSeries) {
      toast.error('Please select an active Series Bible first!');
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
    <div className="space-y-6 text-slate-900 dark:text-white max-w-7xl mx-auto animate-fadeIn relative">
      {!selectedSeries ? (
        <div className="bg-white dark:bg-slate-950/90 border border-emerald-500/30 rounded-3xl p-8 text-center backdrop-blur-2xl shadow-2xl">
          <p className="text-slate-600 dark:text-slate-400 font-medium">Please select an active Series Bible from the Series Bible tab to manage film set locations.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Catalog Action Bar */}
          <div className="bg-white dark:bg-slate-950/90 border border-emerald-500/30 rounded-3xl p-5 backdrop-blur-2xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 font-black shadow-md">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Set Location Catalog</h3>
                  <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                    {locations.length} Film Sets
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Series: <strong className="text-emerald-600 dark:text-emerald-400">{selectedSeries.title}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search set location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-8 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-400 w-44 sm:w-56"
                />
              </div>

              {locations.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectButtonClick}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                >
                  {isSelectMode && (
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      readOnly
                      className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 accent-emerald-500 cursor-pointer"
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
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              )}

              {isSelectMode && selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleBulkDeletePrompt}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition active:scale-95 cursor-pointer animate-fadeIn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete ({selectedIds.size}) Selected</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenAddForm}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
              >
                <Landmark className="w-4 h-4 fill-slate-950" />
                <span>+ Add Set Location</span>
              </button>
            </div>
          </div>

          {/* Full-Width Set Location Catalog Grid */}
          {filteredLocations.length === 0 ? (
            <div className="bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400 space-y-3 shadow-xl">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-3xl text-slate-400">
                🏛️
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-300 text-sm">
                {searchQuery ? `No set locations match "${searchQuery}".` : `No set location assets registered yet for ${selectedSeries.title}.`}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Click "+ Add Set Location" above to register your first film set!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLocations.map((loc) => {
                const isSelected = selectedIds.has(loc.id);
                return (
                  <div
                    key={loc.id}
                    className={`bg-white dark:bg-slate-950/95 border-2 rounded-3xl p-5 backdrop-blur-2xl shadow-xl transition-all space-y-4 group relative flex flex-col justify-between ${
                      isSelected ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-200 dark:border-emerald-500/30 hover:border-emerald-500'
                    }`}
                  >
                    <div
                      className="space-y-3 cursor-pointer group/card"
                      onClick={() => setViewCardModal(loc)}
                    >
                      <div className="flex items-center gap-2.5">
                        {isSelectMode && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelect(loc.id);
                            }}
                            className="rounded border-slate-300 dark:border-slate-700 accent-emerald-500 cursor-pointer w-4 h-4 shrink-0"
                          />
                        )}

                        <div className="h-40 flex-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border-2 border-emerald-500/40 overflow-hidden shadow-lg shadow-emerald-500/10">
                          {loc.reference_images?.[0] ? (
                            <img src={loc.reference_images[0]} alt={loc.name} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">🏛️</div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-lg font-black text-slate-900 dark:text-white truncate group-hover/card:text-emerald-500 transition-colors">{loc.name}</h4>
                          <span className="text-xs bg-slate-100 dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
                            {loc.location_type}
                          </span>
                        </div>

                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          Lighting: {loc.lighting_preset}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <span className="font-bold text-slate-900 dark:text-white">{(loc.reference_images || []).length} Keyframes</span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(loc)}
                          className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-emerald-400 text-emerald-700 dark:text-emerald-300 font-extrabold rounded-xl transition-all text-xs cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSingleDeletePrompt(loc.id, loc.name)}
                          className="p-1.5 bg-red-950/60 border border-red-800 hover:bg-red-900 text-red-300 font-extrabold rounded-xl transition-all text-xs cursor-pointer"
                          title="Delete Location"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
          <div className="bg-white dark:bg-slate-950 border-2 border-emerald-500/50 rounded-3xl p-6 max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh] text-slate-900 dark:text-white">
            {/* Header (Pinned Top) */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 text-lg font-black">
                  🏰
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-wide">
                    {editingId ? 'Edit Set Location' : 'Set Environment Studio'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Configure set architectural details & window lighting.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseFormModal}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-xl cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Scrollable Form Body (Internal Modal Scrollbar Only) */}
            <form onSubmit={handleSubmitLocation} className="flex-1 overflow-y-auto my-4 pr-2 space-y-5">
              {/* Row 1: Set Name, Type & Lighting */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Location / Set Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Villa A - Living Room"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors shadow-inner"
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Set Type</label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Interior">Interior Set</option>
                    <option value="Exterior">Exterior Location</option>
                    <option value="Virtual Studio">Virtual Studio</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Lighting Preset</label>
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
                        <div
                          onClick={() => setPreviewModalUrl(cand.imageUrl)}
                          className="relative w-full h-36 bg-slate-900 overflow-hidden cursor-pointer group/img"
                        >
                          <img
                            src={cand.imageUrl}
                            alt={cand.label}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300 pointer-events-none"
                            loading="lazy"
                          />
                          <span className="absolute top-1.5 left-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-700 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {cand.label}
                          </span>
                        </div>
                        <div className="p-1.5 bg-slate-900 border-t border-slate-800 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewModalUrl(cand.imageUrl)}
                            className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            👁️ View Full
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLockCandidate(cand.imageUrl)}
                            className="flex-1 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md"
                          >
                            🔒 Select
                          </button>
                        </div>
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

      {/* Full Set Location Detail Modal */}
      {viewCardModal && createPortal(
        <div
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-[99999] p-4 sm:p-6 overflow-hidden animate-fadeIn"
          onClick={() => setViewCardModal(null)}
        >
          <div
            className="bg-slate-950 border-2 border-emerald-500/50 rounded-3xl p-6 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-emerald-500/40 overflow-hidden flex-shrink-0 shadow-lg shadow-emerald-500/10 flex items-center justify-center">
                  {viewCardModal.reference_images?.[0] ? (
                    <img src={viewCardModal.reference_images[0]} alt={viewCardModal.name} className="w-full h-full object-cover" />
                  ) : (
                    <Landmark className="w-8 h-8 text-emerald-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white">{viewCardModal.name}</h3>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black px-2.5 py-0.5 rounded-full">
                      {viewCardModal.location_type || 'Interior'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-slate-900 border border-slate-800 text-emerald-400 font-bold text-xs px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Lighting: {viewCardModal.lighting_preset || 'Blue Hour Mood'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewCardModal(null)}
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Architectural Specs */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Architectural & Environment Specs</span>
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {viewCardModal.environment_specs?.architecture || 'No architectural details specified.'}
                </p>
              </div>

              {/* Ambient Props */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Ambient Props & Room Acoustics</span>
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {viewCardModal.environment_specs?.ambientProps || 'No ambient props specified.'}
                </p>
              </div>

              {/* Locked Keyframes Gallery */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Locked Set Location Keyframes ({(viewCardModal.reference_images || []).length})</span>
                  </h5>
                </div>
                <div className="flex gap-3 overflow-x-auto py-1">
                  {(viewCardModal.reference_images || []).map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPreviewModalUrl(img)}
                      className="relative group flex-shrink-0 w-28 h-20 rounded-2xl border-2 border-emerald-400/60 overflow-hidden shadow-lg cursor-pointer"
                    >
                      <img src={img} alt={`set_keyframe_${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Zoom</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const target = viewCardModal;
                  setViewCardModal(null);
                  handleSingleDeletePrompt(target.id, target.name);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-red-950/60 border border-red-800 hover:bg-red-900 text-red-300 font-extrabold rounded-xl text-xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Set</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewCardModal(null)}
                  className="px-4 py-2.5 bg-slate-900 border border-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = viewCardModal;
                    setViewCardModal(null);
                    handleEditClick(target);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit Set Location</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Image Lightbox Full-Screen Preview Modal */}
      {previewModalUrl && createPortal(
        <div
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center z-[100000] p-4 sm:p-8 animate-fadeIn"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="relative bg-slate-950 border-2 border-emerald-500/50 rounded-3xl p-3 max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col items-center justify-between gap-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between px-3 py-1 border-b border-slate-800">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Set Location Keyframe Preview</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full max-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl bg-slate-900 border border-slate-800">
              <img
                src={previewModalUrl}
                alt="AI Set Keyframe Preview"
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
              />
            </div>

            <div className="w-full flex items-center justify-between gap-3 pt-2 px-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="px-4 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  handleLockCandidate(previewModalUrl);
                  setPreviewModalUrl(null);
                }}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Lock This Keyframe</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
