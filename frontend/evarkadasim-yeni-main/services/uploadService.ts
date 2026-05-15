import { apiClient } from './apiClient';

const getMimeType = (uri: string) => {
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  if (ext === 'png') return { ext, mime: 'image/png' };
  if (ext === 'webp') return { ext, mime: 'image/webp' };
  return { ext: 'jpg', mime: 'image/jpeg' };
};

export const uploadService = {
  uploadPhoto: async (uri: string): Promise<string> => {
    const { ext, mime } = getMimeType(uri);
    const formData = new FormData();
    formData.append('file', { uri, type: mime, name: `photo.${ext}` } as any);
    const { data } = await apiClient.post<{ url: string }>('/upload/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return data.url;
  },

  uploadPropertyImage: async (uri: string): Promise<string> => {
    const { ext, mime } = getMimeType(uri);
    const formData = new FormData();
    formData.append('file', { uri, type: mime, name: `property.${ext}` } as any);
    const { data } = await apiClient.post<{ url: string }>('/upload/property', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return data.url;
  },
};
