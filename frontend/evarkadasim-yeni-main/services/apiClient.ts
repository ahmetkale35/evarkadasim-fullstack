import axios from 'axios';
import { API_BASE_URL } from './config';
import { storage } from './storage';
import { authEvents } from './authEvents';

// Interceptor'dan bağımsız, sadece refresh için kullanılır
const refreshClient = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

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

// 401 → refresh token ile yenile; başarısızsa logout
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await storage.getRefreshToken();
      if (refreshToken) {
        try {
          const { data } = await refreshClient.post<{ token: string; refreshToken: string }>(
            '/auth/refresh',
            { refreshToken }
          );
          await storage.saveToken(data.token);
          await storage.saveRefreshToken(data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return apiClient(originalRequest);
        } catch {
          // refresh başarısız → logout
        }
      }

      await storage.clearAll();
      authEvents.emitUnauthorized();
    }

    return Promise.reject(error);
  }
);
