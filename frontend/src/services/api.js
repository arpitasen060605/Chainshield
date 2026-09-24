import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'https://chainshield-backend.onrender.com/api';
const baseURL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl.replace(/\/$/, '')}/api`;

const API = axios.create({
  baseURL,
  timeout: 25000, // 25 seconds timeout to prevent infinite loading state
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Auth token automatically if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('chainshield_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
