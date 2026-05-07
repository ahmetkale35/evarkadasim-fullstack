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
    // Token ve userId cihazda saklanır; sonraki isteklerde otomatik eklenir
    await storage.saveToken(data.token);
    await storage.saveUserId(data.userId);
    return data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
    await storage.saveToken(data.token);
    await storage.saveUserId(data.userId);
    return data;
  },

  logout: async (): Promise<void> => {
    await storage.clearAll();
  },

  // Uygulama açılışında token var mı kontrol eder
  isLoggedIn: async (): Promise<boolean> => {
    const token = await storage.getToken();
    return token !== null;
  },
};
