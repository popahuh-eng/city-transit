import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// ─── Routes ───────────────────────────────────────────────────────────────────
export const routesAPI = {
  getAll: () => api.get('/routes'),
  getById: (id) => api.get(`/routes/${id}`),
  create: (data) => api.post('/routes', data),
  update: (id, data) => api.put(`/routes/${id}`, data),
  delete: (id) => api.delete(`/routes/${id}`),
};

// ─── Schedules ────────────────────────────────────────────────────────────────
export const schedulesAPI = {
  getByRoute: (routeId, days) => api.get(`/schedules/${routeId}`, { params: { days } }),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
};

// ─── Search ───────────────────────────────────────────────────────────────────
export const searchAPI = {
  search: (q) => api.get('/search', { params: { q } }),
};

// ─── Favorites ────────────────────────────────────────────────────────────────
export const favoritesAPI = {
  getAll:  ()         => api.get('/favorites'),
  check:   (routeId)  => api.get(`/favorites/${routeId}`),
  add:     (routeId)  => api.post(`/favorites/${routeId}`),
  remove:  (routeId)  => api.delete(`/favorites/${routeId}`),
};

// ─── Stats ────────────────────────────────────────────────────────────────────
export const statsAPI = {
  get: () => api.get('/stats'),
};

// ─── Route Planner ────────────────────────────────────────────────────────────
export const plannerAPI = {
  between: (from, to) => api.get('/routes/between', { params: { from, to } }),
};

export default api;
