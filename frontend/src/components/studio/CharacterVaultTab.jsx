import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import {
  Users, User, Sparkles, Lock, Eye, Pencil, Trash2,
  UploadCloud, Plus, X, Search, CheckSquare, Square, Mic, ShieldCheck, Film
} from 'lucide-react';
import { uploadStudioAsset, generateCharacterCandidates } from '../../services/studioService';

const SAMPLE_AVATAR_PRESETS = [
  { label: 'Hero Front', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Hero Side', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { label: 'Lead Female', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
  { label: 'Villain Mood', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' }
];

export default function CharacterVaultTab({
  selectedSeries,
  characters = [],
  onCreateCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onBulkDeleteCharacters
}) {
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState(28);
  const [personality, setPersonality] = useState('');
  const [wardrobeDescription, setWardrobeDescription] = useState('');
  const [backstoryNotes, setBackstoryNotes] = useState('');
  const [mannerisms, setMannerisms] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [referenceImages, setReferenceImages] = useState([]);
  const [voiceName, setVoiceName] = useState('Chirp Male HD 01');
  const [uploading, setUploading] = useState(false);

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

  // AI Candidate Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [generatingCandidates, setGeneratingCandidates] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState(null);

  // Open Form for Adding New Character
  const handleOpenAddForm = () => {
    setEditingId(null);
    setName('');
    setAge(28);
    setPersonality('Calm, focused leader with high emotional intensity');
    setWardrobeDescription('Black leather jacket, silver watch, sharp jawline, short trimmed beard, dark denim jeans');
    setBackstoryNotes('Ex-tech founder, lost startup in betrayal, trusts no one');
    setMannerisms('Drives black sedan, keeps phone in left pocket, squints when suspicious');
    setReferenceImages([
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
    ]);
    setShowFormModal(true);
  };

  // Open Form for Editing Existing Character
  const handleEditClick = (c) => {
    setEditingId(c.id);
    setName(c.name || '');
    setAge(c.age || 28);
    setPersonality(c.personality || '');
    setVoiceName(c.voice_profile?.voice || 'Chirp Male HD 01');
    setReferenceImages(c.reference_images || []);
    const traits = c.behavior_traits || [];
    setWardrobeDescription(traits[0] || '');
    setBackstoryNotes(traits[1] || '');
    setMannerisms(traits[2] || '');
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingId(null);
  };

  // Toggle Select Mode / Select All button
  const filteredCharacters = characters.filter((c) =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.personality || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAllSelected = filteredCharacters.length > 0 && selectedIds.size === filteredCharacters.length;

  const handleSelectButtonClick = () => {
    if (!isSelectMode) {
      setIsSelectMode(true);
    } else {
      if (isAllSelected) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(filteredCharacters.map((c) => c.id)));
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
    setDeleteModal({ open: true, type: 'bulk', id: null, name: `${selectedIds.size} characters` });
  };

  // Trigger Single Delete Modal
  const handleSingleDeletePrompt = (id, charName) => {
    setDeleteModal({ open: true, type: 'single', id, name: charName });
  };

  // Confirm Delete Handler
  const confirmDelete = () => {
    if (deleteModal.type === 'bulk') {
      onBulkDeleteCharacters(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectMode(false);
    } else if (deleteModal.type === 'single' && deleteModal.id) {
      onDeleteCharacter(deleteModal.id);
      const next = new Set(selectedIds);
      next.delete(deleteModal.id);
      setSelectedIds(next);
    }
    setDeleteModal({ open: false, type: 'single', id: null, name: '' });
  };

  const handleGenerateCandidates = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingCandidates(true);
    const toastId = toast.loading('Generating 3 AI character candidate variations via Google Vertex AI ($300 Credits)...');
    console.log('[RUKHI STUDIO LOG] 🎨 Generating AI character candidate variations for prompt:', aiPrompt.trim());
    try {
      const res = await generateCharacterCandidates(aiPrompt.trim());
      const cList = res.data?.candidates || res.candidates || [];
      setCandidates(cList);
      toast.success(`Generated ${cList.length} candidate variations!`, { id: toastId });
      console.log('[RUKHI STUDIO LOG] ✅ Candidates generated:', cList.length);
    } catch (err) {
      console.error('[RUKHI STUDIO ERROR] Candidate generation error:', err);
      toast.error('Failed to generate AI character candidates: ' + err.message, { id: toastId });
    } finally {
      setGeneratingCandidates(false);
    }
  };

  const handleLockCandidate = (url) => {
    if (!referenceImages.includes(url)) {
      setReferenceImages([url, ...referenceImages]);
      toast.success('🔒 Keyframe locked as reference DNA!');
      console.log('[RUKHI STUDIO LOG] 🔒 Locked keyframe:', url.substring(0, 50));
    } else {
      toast('Keyframe already in locked reference list', { icon: 'ℹ️' });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading('Uploading asset to Hostinger disk storage...');
    console.log('[RUKHI STUDIO LOG] 📁 Uploading asset file:', file.name);
    try {
      const res = await uploadStudioAsset(file);
      const uploadedUrl = res.data?.url || res.url;
      if (uploadedUrl) {
        setReferenceImages([...referenceImages, uploadedUrl]);
        toast.success('Asset uploaded to Hostinger storage!', { id: toastId });
        console.log('[RUKHI STUDIO LOG] ✅ Asset uploaded:', uploadedUrl);
      }
    } catch (err) {
      console.error('[RUKHI STUDIO ERROR] Asset upload error:', err);
      toast.error('Failed to upload image asset: ' + err.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleAddPreset = (url) => {
    if (!referenceImages.includes(url)) {
      setReferenceImages([...referenceImages, url]);
      toast.success('Added preset keyframe');
    }
  };

  const handleAddImage = () => {
    if (!imageUrl.trim()) return;
    setReferenceImages([...referenceImages, imageUrl.trim()]);
    setImageUrl('');
    toast.success('Added reference URL');
  };

  const handleRemoveImage = (index) => {
    setReferenceImages(referenceImages.filter((_, i) => i !== index));
    toast('Removed keyframe reference', { icon: '🗑️' });
  };

  const handleSubmitCharacter = (e) => {
    e.preventDefault();
    if (!selectedSeries) {
      toast.error('Please select or create a Series Bible first!');
      return;
    }
    if (!name.trim()) return;

    const payload = {
      seriesId: selectedSeries.id,
      name,
      age: parseInt(age, 10),
      personality,
      voiceProfile: { voice: voiceName, speed: '1.0x', pitch: 'natural' },
      referenceImages,
      behaviorTraits: [wardrobeDescription, backstoryNotes, mannerisms]
    };

    if (editingId) {
      setEditConfirmModal({ open: true, payload });
    } else {
      onCreateCharacter(payload);
      setShowFormModal(false);
      setName('');
    }
  };

  const confirmEditSave = () => {
    if (editingId && editConfirmModal.payload) {
      onUpdateCharacter(editingId, editConfirmModal.payload);
      setEditingId(null);
      setShowFormModal(false);
      setName('');
    }
    setEditConfirmModal({ open: false, payload: null });
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-white max-w-7xl mx-auto animate-fadeIn relative">
      {!selectedSeries ? (
        <div className="bg-white dark:bg-slate-950/90 border border-amber-500/30 rounded-3xl p-8 text-center backdrop-blur-2xl shadow-2xl">
          <p className="text-slate-600 dark:text-slate-400 font-medium">Please select an active Series Bible from the Series Bible tab to manage actor character DNA.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Catalog Action Bar */}
          <div className="bg-white dark:bg-slate-950/90 border border-amber-500/30 rounded-3xl p-5 backdrop-blur-2xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 font-black shadow-md">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Master Cast Vault</h3>
                  <span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                    {characters.length} Actors Locked
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Series: <strong className="text-amber-600 dark:text-amber-400">{selectedSeries.title}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search actor name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-8 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-400 w-44 sm:w-56"
                />
              </div>

              {characters.length > 0 && (
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
                      className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 accent-amber-500 cursor-pointer"
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>+ Add Character DNA</span>
              </button>
            </div>
          </div>

          {/* Full-Width Master Cast Roster Grid */}
          {filteredCharacters.length === 0 ? (
            <div className="bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400 space-y-3 shadow-xl">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-3xl text-slate-400">
                🎭
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-300 text-sm">
                {searchQuery ? `No characters match "${searchQuery}".` : `No character fingerprints created yet for ${selectedSeries.title}.`}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Click "+ Add Character DNA" above to register your first actor!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCharacters.map((c) => {
                const isSelected = selectedIds.has(c.id);
                return (
                  <div
                    key={c.id}
                    className={`bg-white dark:bg-slate-950/95 border-2 rounded-3xl p-5 backdrop-blur-2xl shadow-xl transition-all space-y-4 group relative flex flex-col justify-between ${
                      isSelected ? 'border-amber-400 bg-amber-500/10' : 'border-slate-200 dark:border-amber-500/30 hover:border-amber-500'
                    }`}
                  >
                    <div
                      className="space-y-3 cursor-pointer group/card"
                      onClick={() => setViewCardModal(c)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {isSelectMode && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelect(c.id);
                              }}
                              className="rounded border-slate-300 dark:border-slate-700 accent-amber-500 cursor-pointer w-4 h-4"
                            />
                          )}

                          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 border-2 border-amber-400/60 overflow-hidden flex-shrink-0 shadow-lg shadow-amber-500/10">
                            {c.reference_images?.[0] ? (
                              <img src={c.reference_images[0]} alt={c.name} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-lg font-black text-slate-900 dark:text-white truncate group-hover/card:text-amber-500 transition-colors">{c.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 font-bold text-xs px-2 py-0.5 rounded-lg">
                                Age {c.age || 28}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[110px]">
                                {c.voice_profile?.voice || 'Chirp Voice'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-black">
                          v{c.version || 1}.0
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                        {c.personality}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{(c.reference_images || []).length} Keyframes Locked</span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(c)}
                          className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-amber-400 text-amber-600 dark:text-amber-300 font-extrabold rounded-xl transition-all text-xs cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSingleDeletePrompt(c.id, c.name)}
                          className="p-1.5 bg-red-950/60 border border-red-800 hover:bg-red-900 text-red-300 font-extrabold rounded-xl transition-all text-xs cursor-pointer"
                          title="Delete Character"
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
          <div className="bg-slate-950 border-2 border-amber-500/50 rounded-3xl p-6 max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header (Pinned Top) */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg font-black">
                  ✨
                </div>
                <div>
                  <h3 className="text-lg font-black text-amber-400 tracking-wide">
                    {editingId ? 'Edit Character DNA' : 'Character DNA Canvas'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Configure actor facial & wardrobe specs for Rukhi AI Video Engine consistency.
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
            <form onSubmit={handleSubmitCharacter} className="flex-1 overflow-y-auto my-4 pr-2 space-y-5">
              {/* Row 1: Name, Age & Voice Dialect */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">
                    Actor Character Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">Voice Dialect</label>
                  <select
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Chirp Male HD 01">Chirp Male HD (Telugu / Hindi)</option>
                    <option value="Chirp Female HD 02">Chirp Female HD (Emotional)</option>
                    <option value="Deep Accent Male">Deep Voice (Dramatic)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Master Wardrobe & Facial DNA */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black text-amber-400 uppercase tracking-wider">
                    🔒 Master Wardrobe & Facial DNA *
                  </label>
                  <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                    AI Locked
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={wardrobeDescription}
                  onChange={(e) => setWardrobeDescription(e.target.value)}
                  placeholder="Exact haircut, skin tone, facial beard, signature clothing & accessories..."
                  className="w-full bg-slate-900 border border-amber-500/40 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed font-sans shadow-inner"
                />
              </div>

              {/* Row 3: Psychological Demeanor, Backstory & Mannerisms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">
                    Personality & Demeanor
                  </label>
                  <textarea
                    rows={2}
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    placeholder="Emotional posture & focus..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">Backstory</label>
                  <textarea
                    rows={2}
                    value={backstoryNotes}
                    onChange={(e) => setBackstoryNotes(e.target.value)}
                    placeholder="Origin & motivation..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1">Mannerisms</label>
                  <textarea
                    rows={2}
                    value={mannerisms}
                    onChange={(e) => setMannerisms(e.target.value)}
                    placeholder="Physical gait & habits..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Row 4: AI Candidate Generator (Imagen 3) */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>✨ AI Candidate Generator (Imagen 3)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">Human-in-the-Loop</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Describe character appearance..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCandidates}
                    disabled={generatingCandidates}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs whitespace-nowrap transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    {generatingCandidates ? 'Generating...' : '✨ Generate'}
                  </button>
                </div>

                {candidates.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                    {candidates.map((cand) => (
                      <div key={cand.id} className="relative group rounded-xl overflow-hidden border border-amber-500/30 bg-slate-950 flex flex-col justify-between shadow-lg">
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
                          <span className="absolute top-1.5 left-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-700 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
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
                            className="flex-1 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md"
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
                    Active Reference Keyframes ({referenceImages.length})
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SAMPLE_AVATAR_PRESETS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleAddPreset(preset.url)}
                        className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-slate-300 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <label className="cursor-pointer px-4 py-2 bg-slate-950 border border-slate-700 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0">
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
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-2 bg-amber-500 font-black text-slate-950 rounded-xl text-xs cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex gap-2.5 overflow-x-auto py-1">
                  {referenceImages.map((img, idx) => (
                    <div key={idx} className="relative group flex-shrink-0 w-14 h-14 rounded-xl border border-amber-500/50 overflow-hidden shadow-md">
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
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/25 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>🔒</span> {editingId ? 'UPDATE CHARACTER DNA' : 'SAVE MASTER CHARACTER DNA'}
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
                <h4 className="text-lg font-black text-white">Delete Confirmation</h4>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-red-400 font-bold">{deleteModal.name}</strong>? All associated keyframes & DNA records will be permanently removed.
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
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl font-black">
                ✏️
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Update Character DNA</h4>
                <p className="text-xs text-slate-400">Save changes to actor fingerprint.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Save updated DNA for <strong className="text-amber-400 font-bold">{editConfirmModal.payload?.name}</strong>? Rukhi Film Engine continuity will adopt these changes for future scenes.
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
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/30 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Full Character DNA Detail Modal */}
      {viewCardModal && createPortal(
        <div
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-[99999] p-4 sm:p-6 overflow-hidden animate-fadeIn"
          onClick={() => setViewCardModal(null)}
        >
          <div
            className="bg-slate-950 border-2 border-amber-500/50 rounded-3xl p-6 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-amber-400/60 overflow-hidden flex-shrink-0 shadow-lg shadow-amber-500/10 flex items-center justify-center">
                  {viewCardModal.reference_images?.[0] ? (
                    <img src={viewCardModal.reference_images[0]} alt={viewCardModal.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-amber-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white">{viewCardModal.name}</h3>
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black px-2.5 py-0.5 rounded-full">
                      v{viewCardModal.version || 1}.0
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-slate-900 border border-slate-800 text-amber-400 font-bold text-xs px-2.5 py-0.5 rounded-lg">
                      Age {viewCardModal.age || 28}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <Mic className="w-3.5 h-3.5 text-amber-400" />
                      <span>{viewCardModal.voice_profile?.voice || 'Chirp Male HD 01'}</span>
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
              {/* Personality */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <h5 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Personality & Emotional Demeanor</span>
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {viewCardModal.personality || 'No personality description provided.'}
                </p>
              </div>

              {/* Behavior Traits (Wardrobe, Backstory, Mannerisms) */}
              {viewCardModal.behavior_traits && viewCardModal.behavior_traits.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <h6 className="text-[10px] font-black text-amber-400 uppercase mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Wardrobe & Facial Specs</span>
                    </h6>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {viewCardModal.behavior_traits[0] || 'Default casual'}
                    </p>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <h6 className="text-[10px] font-black text-amber-400 uppercase mb-1 flex items-center gap-1">
                      <Film className="w-3.5 h-3.5 text-amber-400" />
                      <span>Backstory Notes</span>
                    </h6>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {viewCardModal.behavior_traits[1] || 'None specified'}
                    </p>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <h6 className="text-[10px] font-black text-amber-400 uppercase mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Physical Mannerisms</span>
                    </h6>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {viewCardModal.behavior_traits[2] || 'None specified'}
                    </p>
                  </div>
                </div>
              )}

              {/* Locked Keyframes Gallery */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Locked Character Keyframes ({(viewCardModal.reference_images || []).length})</span>
                  </h5>
                </div>
                <div className="flex gap-3 overflow-x-auto py-1">
                  {(viewCardModal.reference_images || []).map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPreviewModalUrl(img)}
                      className="relative group flex-shrink-0 w-24 h-24 rounded-2xl border-2 border-amber-400/60 overflow-hidden shadow-lg cursor-pointer"
                    >
                      <img src={img} alt={`keyframe_${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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
                <span>Delete Character</span>
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
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit Character DNA</span>
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
            className="relative bg-slate-950 border-2 border-amber-500/50 rounded-3xl p-3 max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col items-center justify-between gap-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between px-3 py-1 border-b border-slate-800">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>High-Resolution Keyframe Preview</span>
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
                alt="AI Keyframe Preview"
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
                className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/25 cursor-pointer"
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
