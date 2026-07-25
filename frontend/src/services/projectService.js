import axiosClient from '../api/axiosClient';

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
export async function uploadVideo(file, title, onProgress) {
  const formData = new FormData();
  formData.append('video', file);
  if (title) formData.append('title', title);

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
 * Generate AI Instagram & YouTube post-ready title, caption, and #hashtags.
 * @param {string} projectId
 */
export async function generateSocialPack(projectId) {
  return axiosClient.post(`/projects/${projectId}/social-pack`);
}
