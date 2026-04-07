import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API}/api`,
  withCredentials: true
});

// Request interceptor to refresh token if needed
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post(`${API}/api/auth/refresh`, {}, { withCredentials: true });
        return api(originalRequest);
      } catch (refreshError) {
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Clienti
export const getClienti = () => api.get('/clienti');
export const createCliente = (data) => api.post('/clienti', data);
export const updateCliente = (id, data) => api.put(`/clienti/${id}`, data);
export const deleteCliente = (id) => api.delete(`/clienti/${id}`);

// Operazioni Template
export const getOperazioniTemplate = (reparto) => api.get('/operazioni-template', { params: reparto ? { reparto } : {} });
export const createOperazioneTemplate = (data) => api.post('/operazioni-template', data);
export const deleteOperazioneTemplate = (id) => api.delete(`/operazioni-template/${id}`);

// Schede Lavoro
export const getSchede = (params) => api.get('/schede', { params });
export const getScheda = (id) => api.get(`/schede/${id}`);
export const createScheda = (data) => api.post('/schede', data);
export const updateScheda = (id, data) => api.put(`/schede/${id}`, data);
export const deleteScheda = (id) => api.delete(`/schede/${id}`);

// Stats
export const getStatsOverview = (reparto) => api.get('/stats/overview', { params: reparto ? { reparto } : {} });
export const getStatsPerCliente = () => api.get('/stats/per-cliente');
export const getStatsPerOperatore = () => api.get('/stats/per-operatore');
export const getStatsPerPeriodo = (params) => api.get('/stats/per-periodo', { params });
export const getStatsPerOperazione = () => api.get('/stats/per-operazione');

// Users (Admin)
export const getUsers = () => api.get('/users');
export const updateUserRole = (id, role) => api.put(`/users/${id}/role?role=${role}`);

export default api;
