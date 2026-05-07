import { apiClient } from './apiClient';

export interface MyProfile {
  id: string;
  name: string;
  lastName?: string;
  age: number;
  bio?: string;
  photos: string[];
  location?: { city?: string };
  interests: string[];
  occupation?: string;
  education?: string;
  isVerified: boolean;
  likedProfilesCount: number;
  matchesCount: number;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  age?: number;
  bio?: string;
  occupation?: string;
  education?: string;
  city?: string;
}

export const profileService = {
  getMyProfile: async (): Promise<MyProfile> => {
    const { data } = await apiClient.get<MyProfile>('/profile');
    return data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<void> => {
    await apiClient.put('/profile', payload);
  },
};
