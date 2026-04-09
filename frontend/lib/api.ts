import axios from 'axios';

/**
 * Construct API URL with /api path
 * Handles both full URLs and raw backend URLs
 * Examples:
 *   - "http://localhost:5000" → "http://localhost:5000/api"
 *   - "http://localhost:5000/api" → "http://localhost:5000/api"
 *   - "https://backend.onrender.com" → "https://backend.onrender.com/api"
 */
const getApiUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
  
  // Ensure baseUrl ends with /api
  const url = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  return url;
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('bm_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bm_token');
        localStorage.removeItem('bm_user');
        // Redirect if not on auth pages
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
