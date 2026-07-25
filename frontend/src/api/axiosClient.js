import axios from 'axios';

/**
 * Global Axios Client Configuration
 */
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': '00000000-0000-0000-0000-000000000001', // Default dev user ID
  },
});

// Response interceptor for consistent error extraction
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error?.message || error.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
