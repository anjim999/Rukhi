import axiosClient from '../api/axiosClient';

/**
 * Frontend Service for Rukhi AI Film Studio & Director Engine
 */

export async function createStudioSeries(payload) {
  return await axiosClient.post('/studio/series', payload);
}

export async function listStudioSeries() {
  return await axiosClient.get('/studio/series');
}

export async function getStudioSeriesById(id) {
  return await axiosClient.get(`/studio/series/${id}`);
}

export async function createStudioCharacter(payload) {
  return await axiosClient.post('/studio/characters', payload);
}

export async function listStudioCharacters(seriesId) {
  return await axiosClient.get(`/studio/characters/series/${seriesId}`);
}

export async function createStudioLocation(payload) {
  return await axiosClient.post('/studio/locations', payload);
}

export async function listStudioLocations(seriesId) {
  return await axiosClient.get(`/studio/locations/series/${seriesId}`);
}

export async function compileStudioBrief(payload) {
  return await axiosClient.post('/studio/compile-brief', payload);
}

export async function preflightCheckStudio(payload) {
  return await axiosClient.post('/studio/preflight-check', payload);
}

export async function orchestrateStudioScene(payload) {
  return await axiosClient.post('/studio/generate-scene', payload);
}

export async function uploadStudioAsset(file) {
  const formData = new FormData();
  formData.append('asset', file);
  return await axiosClient.post('/studio/upload-asset', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export async function generateCharacterCandidates(prompt) {
  return await axiosClient.post('/studio/generate-character-candidates', { prompt });
}

export async function generateLocationCandidates(prompt) {
  return await axiosClient.post('/studio/generate-location-candidates', { prompt });
}

export async function listStudioScenes(seriesId) {
  return await axiosClient.get(`/studio/scenes/series/${seriesId}`);
}

export async function updateStudioCharacter(id, payload) {
  return await axiosClient.put(`/studio/characters/${id}`, payload);
}

export async function deleteStudioCharacter(id) {
  return await axiosClient.delete(`/studio/characters/${id}`);
}

export async function bulkDeleteStudioCharacters(ids) {
  return await axiosClient.post('/studio/characters/bulk-delete', { ids });
}

export async function updateStudioLocation(id, payload) {
  return await axiosClient.put(`/studio/locations/${id}`, payload);
}

export async function deleteStudioLocation(id) {
  return await axiosClient.delete(`/studio/locations/${id}`);
}

export async function bulkDeleteStudioLocations(ids) {
  return await axiosClient.post('/studio/locations/bulk-delete', { ids });
}

export async function deleteStudioScene(id) {
  return await axiosClient.delete(`/studio/scenes/${id}`);
}

export async function bulkDeleteStudioScenes(ids) {
  return await axiosClient.post('/studio/scenes/bulk-delete', { ids });
}

export async function stitchEpisodeScenes({ seriesId, episodeNumber }) {
  return await axiosClient.post('/studio/stitch-episode', { seriesId, episodeNumber });
}

export async function generateStudioAiShotList(payload) {
  return await axiosClient.post('/studio/generate-ai-shotlist', payload);
}
