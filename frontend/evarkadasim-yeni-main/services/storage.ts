import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';

export const storage = {
  saveToken: (token: string) => AsyncStorage.setItem(TOKEN_KEY, token),
  getToken: () => AsyncStorage.getItem(TOKEN_KEY),
  removeToken: () => AsyncStorage.removeItem(TOKEN_KEY),

  saveUserId: (id: string) => AsyncStorage.setItem(USER_ID_KEY, id),
  getUserId: () => AsyncStorage.getItem(USER_ID_KEY),
  removeUserId: () => AsyncStorage.removeItem(USER_ID_KEY),

  // Logout sırasında token + userId birlikte temizlenir
  clearAll: () => AsyncStorage.multiRemove([TOKEN_KEY, USER_ID_KEY]),
};
