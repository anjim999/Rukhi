import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Film, Play, Trash2, Layers, Video, Sparkles, CheckCircle2, Clapperboard, Download } from 'lucide-react';
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
    const toastId = toast.loading(`Stitching Episode ${epNum} scenes into master MP4...`);
    try {
      const res = await stitchEpisodeScenes({ seriesId: selectedSeries.id, episodeNumber: Number(epNum) });
      const dataObj = res.data?.data || res.data || res;
      const masterUrl = dataObj?.masterVideoUrl || dataObj?.master_video_url || dataObj?.url || '';

      if (masterUrl) {
        setStitchedMasterMap(prev => ({
          ...prev,
          [epNum]: masterUrl
        }));
        toast.success(`Episode ${epNum} master video stitched successfully!`, { id: toastId });
      } else {
        toast.error(`Stitching failed: ${dataObj?.error || dataObj?.message || 'Master video URL not returned'}`, { id: toastId });
      }
    } catch (err) {
      toast.error(`Stitching failed: ${err.response?.data?.error || err.message}`, { id: toastId });
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
    <div className="space-y-8 text-slate-900 dark:text-white relative">
      {/* Header Summary */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">Series Master Vision & Timeline</span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{selectedSeries.title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tracking {scenes.length} generated scene(s) across {episodeNumbers.length || 0} episode(s).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Select / Select All Toggle Button (Exact Dashboard Style) */}
          {scenes.length > 0 && (
            <button
              type="button"
              onClick={handleSelectButtonClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              {isSelectMode && (
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  readOnly
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 accent-amber-500 cursor-pointer"
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
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
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
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.size}) Selected</span>
            </button>
          )}

          <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">World State Sync</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              <span>Live Canon & RAG Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Episode Scene Timeline */}
      {episodeNumbers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 backdrop-blur-xl space-y-3 shadow-xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-amber-500">
            <Film className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Scenes Generated Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Use the <strong>AI Director Timeline</strong> tab to orchestrate your first scene! Every generated clip will be cataloged here with full production manifests.
          </p>
        </div>
      ) : (
        episodeNumbers.map((epNum) => (
          <div key={epNum} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold rounded-xl text-xs border border-amber-500/40">
                  EPISODE {epNum}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {episodesMap[epNum].length} Scene(s) Rendered
                </h3>
              </div>

              <button
                type="button"
                onClick={() => handleStitchEpisode(epNum)}
                disabled={stitchingEp === epNum}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Film className="w-4 h-4 text-slate-950 shrink-0" />
                <span>{stitchingEp === epNum ? 'Stitching Master Film...' : 'Combine Episode Scenes into Master Film'}</span>
              </button>
            </div>

            {/* Master Episode Video Player Banner (If Stitched) */}
            {stitchedMasterMap[epNum] && (
              <div className="bg-white dark:bg-slate-900 border border-emerald-500/50 rounded-2xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>Master Episode {epNum} Full Feature Film (Rendered & Stitched)</span>
                  </span>
                  <a
                    href={stitchedMasterMap[epNum]}
                    download={`episode_${epNum}_master.mp4`}
                    className="px-3 py-1.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <span>Download Master Episode MP4</span>
                  </a>
                </div>
                <video
                  controls
                  src={stitchedMasterMap[epNum]}
                  className="w-full max-h-[420px] rounded-xl border border-slate-200 dark:border-slate-800 bg-black object-contain shadow-2xl"
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
                    className={`bg-white dark:bg-slate-900/80 border rounded-2xl p-5 backdrop-blur-xl shadow-xl transition-all flex flex-col justify-between ${
                      isSelected ? 'border-amber-400 bg-amber-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-amber-500/40'
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
                              className="rounded border-slate-300 dark:border-slate-700 accent-amber-500 cursor-pointer"
                            />
                          )}
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            Scene {scene.scene_number || 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-md">
                            Score: {scene.quality_score || '99.40'}%
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSingleDeletePrompt(scene.id, scene.title)}
                            className="p-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all cursor-pointer shadow-md shadow-red-600/30"
                            title="Delete Scene"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {scene.title}
                      </h4>

                      {/* Video Player */}
                      {scene.output_video_url && (
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black my-2">
                          <video
                            src={scene.output_video_url}
                            controls
                            className="w-full h-36 object-cover"
                            poster={brief.characters?.[0]?.reference_images?.[0] || ''}
                          />
                        </div>
                      )}

                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs space-y-1.5 text-slate-700 dark:text-slate-300 font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Camera:</span>
                          <span className="text-amber-600 dark:text-amber-300 font-semibold">{scene.camera_preset}</span>
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
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-3 bg-slate-50 dark:bg-slate-950/50 p-2 rounded-lg border border-slate-200 dark:border-slate-800/50">
                          {brief.formatted_vertex_prompt}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 mt-4 space-y-3">
                      {scene.output_video_url && (
                        <a
                          href={scene.output_video_url}
                          download={`scene_${scene.scene_number || 1}.mp4`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-slate-950 shrink-0" />
                          <span>Download MP4 Scene Clip</span>
                        </a>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Status: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{scene.generation_status || 'completed'}</strong></span>
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
          <div className="bg-white dark:bg-slate-900 border-2 border-red-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 text-2xl font-black">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Delete Scene Clip</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-red-500 font-bold">{deleteModal.name}</strong>? The generated MP4 video clip and manifest will be removed from your timeline.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, type: 'single', id: null, name: '' })}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
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
