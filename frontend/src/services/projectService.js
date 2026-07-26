import axiosClient from '../api/axiosClient';

/**
 * Resolve relative media paths (/uploads/...) to full backend URLs.
 * @param {string} url
 */
export function getFullMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  const rawApiBase = import.meta.env.VITE_API_BASE_URL;
  const serverRoot = rawApiBase ? rawApiBase.replace(/\/api\/?$/, '') : '';
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${serverRoot}${cleanPath}`;
}

/**
 * Frontend Project Service
 */

/**
 * Upload a video file and create a new caption project.
 *
 * @param {File} file - Video file object
 * @param {string} [title] - Optional title
 * @param {Function} [onProgress] - Upload progress callback (0-100)
 */
export async function uploadVideo(file, title, targetStyle = 'auto', onProgress) {
  if (typeof targetStyle === 'function') {
    onProgress = targetStyle;
    targetStyle = 'auto';
  }

  const formData = new FormData();
  formData.append('video', file);
  if (title) formData.append('title', title);
  if (targetStyle) formData.append('targetStyle', targetStyle);

  return axiosClient.post('/projects/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
}

/**
 * Fetch details of a single project.
 * @param {string} projectId
 */
export async function getProject(projectId) {
  return axiosClient.get(`/projects/${projectId}`);
}

/**
 * Fetch user's project list.
 * @param {number} [page=1]
 */
export async function listProjects(page = 1) {
  return axiosClient.get(`/projects?page=${page}`);
}

/**
 * Fetch project caption timeline JSON.
 * @param {string} projectId
 */
export async function getProjectTimeline(projectId) {
  return axiosClient.get(`/projects/${projectId}/timeline`);
}

/**
 * Save/update project caption timeline.
 * @param {string} projectId
 * @param {Object} timeline
 */
export async function updateProjectTimeline(projectId, timeline) {
  return axiosClient.put(`/projects/${projectId}/timeline`, { timeline });
}

/**
 * Translate caption timeline into target language while preserving timestamps.
 * @param {string} projectId
 * @param {string} targetStyle
 * @param {Object} [timeline]
 */
export async function translateProjectTimeline(projectId, targetStyle = 'english', timeline = null) {
  return axiosClient.post(`/projects/${projectId}/translate`, { targetStyle, timeline });
}

/**
 * Generate AI Instagram & YouTube post-ready title, caption, and #hashtags.
 * @param {string} projectId
 */
export async function generateSocialPack(projectId) {
  return axiosClient.post(`/projects/${projectId}/social-pack`);
}

/**
 * Render broadcast-grade 60FPS H.264 MP4 video via server-side FFmpeg.
 * @param {string} projectId
 */
export async function exportProjectMP4(projectId, quality = '1080p', options = {}) {
  return axiosClient.post(`/projects/${projectId}/export`, { quality }, options);
}

/**
 * Remux a recorded canvas blob into an Instagram-ready MP4 with +faststart moov duration header.
 * @param {Blob} blob
 * @param {string} title
 */
export async function remuxRecordedBlob(blob, title) {
  const formData = new FormData();
  formData.append('video', blob, 'recording.webm');
  if (title) formData.append('title', title);

  return axiosClient.post('/projects/remux', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * Cancel project caption generation.
 * @param {string} projectId
 */
export async function cancelProject(projectId) {
  return axiosClient.post(`/projects/${projectId}/cancel`);
}

/**
 * Pause project caption generation.
 * @param {string} projectId
 */
export async function pauseProject(projectId) {
  return axiosClient.post(`/projects/${projectId}/pause`);
}

/**
 * Resume project caption generation.
 * @param {string} projectId
 */
export async function resumeProject(projectId) {
  return axiosClient.post(`/projects/${projectId}/resume`);
}

export async function renameProject(projectId, title) {
  return axiosClient.patch(`/projects/${projectId}/rename`, { title });
}

/**
 * Delete a project.
 * @param {string} projectId
 */
export async function deleteProject(projectId) {
  return axiosClient.delete(`/projects/${projectId}`);
}
