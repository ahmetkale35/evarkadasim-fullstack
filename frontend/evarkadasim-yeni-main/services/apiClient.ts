import axios from 'axios';
import { API_BASE_URL } from './config';
import { storage } from './storage';
import { authEvents } from './authEvents';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Her istekten önce AsyncStorage'dan token okunur ve header'a eklenir
apiClient.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 → token geçersiz; temizle ve _layout.tsx'i event ile haberdar et
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.clearAll();
      authEvents.emitUnauthorized();
    }
    return Promise.reject(error);
  }
);
