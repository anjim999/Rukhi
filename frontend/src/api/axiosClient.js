import axios from 'axios';

/**
 * Global Axios Client Configuration
 */
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const baseURL = rawBaseUrl ? (rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl) : '/api';

const axiosClient = axios.create({
  baseURL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getBrowserGuestId() {
  let guestId = localStorage.getItem('auto_captions_guest_id');
  if (!guestId) {
    guestId = '00000000-0000-4000-8000-' + Math.random().toString(16).substring(2, 14).padStart(12, '0');
    localStorage.setItem('auto_captions_guest_id', guestId);
  }
  return guestId;
}

// Request interceptor to attach JWT token or unique browser guest ID
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auto_captions_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    config.headers['x-user-id'] = getBrowserGuestId();
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor for consistent error extraction
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error?.message || error.response?.data?.error || error.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
