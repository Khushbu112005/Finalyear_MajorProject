import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: Attach JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('civicsphere_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Global error handling & 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized occurs on protected endpoints, clear storage if expired
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint =
        error.config.url.includes('/auth/login') ||
        error.config.url.includes('/auth/register');

      if (!isAuthEndpoint) {
        localStorage.removeItem('civicsphere_token');
        localStorage.removeItem('civicsphere_user');
        // Only redirect if on protected route and not already on /login
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register') &&
          window.location.pathname !== '/'
        ) {
          window.location.href = '/login?session=expired';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
