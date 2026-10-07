import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const getAuthToken = () => localStorage.getItem('token');

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// System Health
export const getSystemHealth = async () => {
  const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
  return response.data;
};

// Streetlights
export const getStreetlights = async (params = {}) => {
  const response = await apiClient.get('/streetlights', { params });
  return response.data;
};

export const getStreetlightById = async (poleId) => {
  const response = await apiClient.get(`/streetlights/${poleId}`);
  return response.data;
};

export const upsertStreetlight = async (data) => {
  const response = await apiClient.post('/streetlights', data);
  return response.data;
};

// Telemetry & AI Diagnosis
export const postTelemetry = async (telemetryData) => {
  const response = await apiClient.post('/telemetry', telemetryData);
  return response.data;
};

export const getTelemetryHistory = async (poleId, limit = 20) => {
  const response = await apiClient.get(`/telemetry/${poleId}`, { params: { limit } });
  return response.data;
};

// Maintenance Tickets
export const getTickets = async (params = {}) => {
  const response = await apiClient.get('/tickets', { params });
  return response.data;
};

export const getTicketById = async (ticketId) => {
  const response = await apiClient.get(`/tickets/${ticketId}`);
  return response.data;
};

export const updateTicketStatus = async (ticketId, status) => {
  const response = await apiClient.patch(`/tickets/${ticketId}/status`, { status });
  return response.data;
};

export const createTicket = async (ticketData) => {
  const response = await apiClient.post('/tickets', ticketData);
  return response.data;
};

// Blockchain Audit
export const getBlockchainStatus = async () => {
  const response = await apiClient.get('/blockchain/status');
  return response.data;
};

export const recordBlockchainEvent = async (eventData) => {
  const response = await apiClient.post('/blockchain/record', eventData);
  return response.data;
};

export const getBlockchainRecord = async (recordId) => {
  const response = await apiClient.get(`/blockchain/record/${recordId}`);
  return response.data;
};

export const apiService = {
  getSystemHealth,
  getStreetlights,
  getStreetlightById,
  upsertStreetlight,
  postTelemetry,
  getTelemetryHistory,
  getTickets,
  getTicketById,
  updateTicketStatus,
  createTicket,
  getBlockchainStatus,
  recordBlockchainEvent,
  getBlockchainRecord,
  get: (url, params) => apiClient.get(url, { params }),
  post: (url, data) => apiClient.post(url, data),
  patch: (url, data) => apiClient.patch(url, data),
  put: (url, data) => apiClient.put(url, data),
  delete: (url) => apiClient.delete(url),
};

export default apiService;
