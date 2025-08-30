import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  if (userId) config.headers['X-User-Id'] = userId;
  if (userRole) config.headers['X-User-Role'] = userRole;
  return config;
});

export const documentAPI = {
  upload: async (formData) => {
    const res = await api.post('/docs/upload/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },
  getAll: async (params = {}) => (await api.get('/docs/', { params })).data,
  getById: async (docId) => (await api.get(`/docs/${docId}/`)).data,
  updateStatus: async (docId, action) => (await api.patch(`/docs/${docId}/status/`, { action })).data,
  verifyByHash: async ({ doc_id, file_hash }) => (await api.post('/verify/', { doc_id, file_hash })).data,
  verifyByFile: async (docId, file) => {
    const fd = new FormData();
    fd.append('doc_id', docId);
    fd.append('file', file);
    return (await api.post('/verify/file/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  },
};

export default api;


