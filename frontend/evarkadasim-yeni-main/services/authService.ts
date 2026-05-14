import { apiClient } from './apiClient';
import { storage } from './storage';

interface AuthResponse {
  token: string;
  expiration: string;
  userId: string;
  name: string;
  refreshToken: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  lastName: string;
  email: string;
  password: string;
  lookingFor: 'Roommate' | 'Room';
  city?: string;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    await storage.saveToken(data.token);
    await storage.saveUserId(data.userId);
    await storage.saveRefreshToken(data.refreshToken);
    return data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
    await storage.saveToken(data.token);
    await storage.saveUserId(data.userId);
    await storage.saveRefreshToken(data.refreshToken);
    return data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = await storage.getRefreshToken();
    try {
      await apiClient.post('/auth/logout', null, {
        headers: refreshToken ? { 'X-Refresh-Token': refreshToken } : {},
      });
    } catch {
      // backend erişilemez olsa bile local temizlik yapılır
    }
    await storage.clearAll();
  },

  // Uygulama açılışında token var mı kontrol eder
  isLoggedIn: async (): Promise<boolean> => {
    const token = await storage.getToken();
    return token !== null;
  },
};
