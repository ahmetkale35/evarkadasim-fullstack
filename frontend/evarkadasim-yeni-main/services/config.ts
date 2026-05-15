// Fiziksel cihaz: EXPO_PUBLIC_DEV_HOST=192.168.x.x .env dosyasına yaz
// Emülatör: EXPO_PUBLIC_DEV_HOST=10.0.2.2
const DEV_HOST = process.env.EXPO_PUBLIC_DEV_HOST ?? '10.0.2.2';

export const API_BASE_URL = `http://${DEV_HOST}:5145/api`;
export const HUB_BASE_URL = `http://${DEV_HOST}:5145`;
