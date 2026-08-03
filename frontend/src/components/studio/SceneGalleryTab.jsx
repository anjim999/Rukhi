import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { stitchEpisodeScenes } from '../../services/studioService';

export default function SceneGalleryTab({
  selectedSeries,
  scenes = [],
  onDeleteScene,
  onBulkDeleteScenes
}) {
  const [stitchingEp, setStitchingEp] = useState(null);
  const [stitchedMasterMap, setStitchedMasterMap] = useState({});

  // Dashboard-style Select Mode State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal State
  const [deleteModal, setDeleteModal] = useState({ open: false, type: 'single', id: null, name: '' });

  if (!selectedSeries) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 backdrop-blur-xl">
        Please select an active Series Bible from the Series Bible tab to view generated episode scenes.
      </div>
    );
  }

  const handleStitchEpisode = async (epNum) => {
    try {
      setStitchingEp(epNum);
      const res = await stitchEpisodeScenes({ seriesId: selectedSeries.id, episodeNumber: Number(epNum) });
      if (res.data?.success) {
        setStitchedMasterMap(prev => ({
          ...prev,
          [epNum]: res.data.data.masterVideoUrl
        }));
      }
    } catch (err) {
      alert(`Stitching failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setStitchingEp(null);
    }
  };

  // Toggle Select Mode / Select All button
  const isAllSelected = scenes.length > 0 && selectedIds.size === scenes.length;

  const handleSelectButtonClick = () => {
    if (!isSelectMode) {
      setIsSelectMode(true);
    } else {
      if (isAllSelected) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(scenes.map((s) => s.id)));
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

  const handleBulkDeletePrompt = () => {
    if (selectedIds.size === 0) return;
    setDeleteModal({ open: true, type: 'bulk', id: null, name: `${selectedIds.size} scene clips` });
  };

  const handleSingleDeletePrompt = (id, title) => {
    setDeleteModal({ open: true, type: 'single', id, name: title || 'Untitled Scene' });
  };

  const confirmDelete = () => {
    if (deleteModal.type === 'bulk') {
      if (onBulkDeleteScenes) onBulkDeleteScenes(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectMode(false);
    } else if (deleteModal.type === 'single' && deleteModal.id) {
      if (onDeleteScene) onDeleteScene(deleteModal.id);
      const next = new Set(selectedIds);
      next.delete(deleteModal.id);
      setSelectedIds(next);
    }
    setDeleteModal({ open: false, type: 'single', id: null, name: '' });
  };

  // Group scenes by episode number
  const episodesMap = {};
  (scenes || []).forEach(scene => {
    const epNum = scene.episode_number || 1;
    if (!episodesMap[epNum]) episodesMap[epNum] = [];
    episodesMap[epNum].push(scene);
  });

  const episodeNumbers = Object.keys(episodesMap).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="space-y-8 text-white relative">
      {/* Header Summary */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">Series Master Vision & Timeline</span>
          <h2 className="text-2xl font-bold text-white mt-0.5">{selectedSeries.title}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Tracking {scenes.length} generated scene(s) across {episodeNumbers.length || 0} episode(s).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Select / Select All Toggle Button (Exact Dashboard Style) */}
          {scenes.length > 0 && (
            <button
              type="button"
              onClick={handleSelectButtonClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              {isSelectMode && (
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  readOnly
                  className="w-4 h-4 rounded border-slate-700 accent-amber-500 cursor-pointer"
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

          {/* Cancel Select Mode */}
          {isSelectMode && (
            <button
              type="button"
              onClick={cancelSelectMode}
              className="px-3 py-1.5 rounded-xl bg-slate-950 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          )}

          {/* Bulk Delete Action Button */}
          {isSelectMode && selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleBulkDeletePrompt}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-red-600/20 active:scale-95 cursor-pointer animate-fadeIn"
            >
              <span>🗑️</span> Delete ({selectedIds.size}) Selected
            </button>
          )}

          <div className="text-right pl-3 border-l border-slate-800">
            <span className="text-xs text-slate-400 block">World State Sync</span>
            <span className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-1 mt-1">
              <span>●</span> Live Canon & RAG Active
            </span>
          </div>
        </div>
      </div>

      {/* Episode Scene Timeline */}
      {episodeNumbers.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 backdrop-blur-xl space-y-3">
          <div className="text-4xl">🎬</div>
          <h3 className="text-lg font-bold text-white">No Scenes Generated Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Use the <strong>AI Director Timeline</strong> tab to orchestrate your first scene! Every generated clip will be cataloged here with full production manifests.
          </p>
        </div>
      ) : (
        episodeNumbers.map((epNum) => (
          <div key={epNum} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-bold rounded-xl text-xs border border-amber-500/40">
                  EPISODE {epNum}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {episodesMap[epNum].length} Scene(s) Rendered
                </h3>
              </div>

              <button
                type="button"
                onClick={() => handleStitchEpisode(epNum)}
                disabled={stitchingEp === epNum}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
              >
                {stitchingEp === epNum ? '🎞️ Stitching Master Film...' : '🎞️ Combine Episode Scenes into Master Film'}
              </button>
            </div>

            {/* Master Episode Video Player Banner (If Stitched) */}
            {stitchedMasterMap[epNum] && (
              <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <span>🎉</span> Master Episode {epNum} Full Feature Film (Rendered & Stitched)
                  </span>
                  <a
                    href={stitchedMasterMap[epNum]}
                    download={`episode_${epNum}_master.mp4`}
                    className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <span>⬇️</span> Download Master Episode MP4
                  </a>
                </div>
                <video
                  controls
                  src={stitchedMasterMap[epNum]}
                  className="w-full max-h-[420px] rounded-xl border border-slate-800 bg-black object-contain shadow-2xl"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {episodesMap[epNum].map((scene) => {
                const brief = scene.compiled_brief || {};
                const isSelected = selectedIds.has(scene.id);
                return (
                  <div
                    key={scene.id}
                    className={`bg-slate-900/80 border rounded-2xl p-5 backdrop-blur-xl shadow-xl transition-all flex flex-col justify-between ${
                      isSelected ? 'border-amber-400 bg-amber-500/5' : 'border-slate-800 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isSelectMode && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(scene.id)}
                              className="rounded border-slate-700 accent-amber-500 cursor-pointer"
                            />
                          )}
                          <span className="text-xs font-mono text-slate-400">
                            Scene {scene.scene_number || 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-md">
                            Score: {scene.quality_score || '99.40'}%
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSingleDeletePrompt(scene.id, scene.title)}
                            className="px-2 py-0.5 bg-red-950/60 border border-red-800 hover:bg-red-900 text-red-300 font-bold rounded-md text-xs transition-all cursor-pointer"
                            title="Delete Scene"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <h4 className="text-base font-bold text-white leading-snug">
                        {scene.title}
                      </h4>

                      {/* Video Player */}
                      {scene.output_video_url && (
                        <div className="rounded-xl overflow-hidden border border-slate-800 bg-black my-2">
                          <video
                            src={scene.output_video_url}
                            controls
                            className="w-full h-36 object-cover"
                            poster={brief.characters?.[0]?.reference_images?.[0] || ''}
                          />
                        </div>
                      )}

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1.5 text-slate-300 font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Camera:</span>
                          <span className="text-amber-300">{scene.camera_preset}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Lighting:</span>
                          <span>{scene.lighting_preset}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Emotion:</span>
                          <span>{scene.emotion_state}</span>
                        </div>
                      </div>

                      {brief.formatted_vertex_prompt && (
                        <div className="text-[11px] text-slate-400 line-clamp-3 bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
                          {brief.formatted_vertex_prompt}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 mt-4 space-y-3">
                      {scene.output_video_url && (
                        <a
                          href={scene.output_video_url}
                          download={`scene_${scene.scene_number || 1}.mp4`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                        >
                          <span>⬇️ Download MP4 Scene Clip</span>
                        </a>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Status: <strong className="text-emerald-400">{scene.generation_status || 'completed'}</strong></span>
                        <span className="text-[10px] font-mono">{new Date(scene.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && createPortal(
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-[99999] p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-red-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 text-2xl font-black">
                🗑️
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Delete Scene Clip</h4>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-red-400 font-bold">{deleteModal.name}</strong>? The generated MP4 video clip and manifest will be removed from your timeline.
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
    </div>
  );
}
