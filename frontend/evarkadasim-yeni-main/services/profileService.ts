import { apiClient } from './apiClient';

export interface MyProfile {
  id: string;
  name: string;
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

export const profileService = {
  getMyProfile: async (): Promise<MyProfile> => {
    const { data } = await apiClient.get<MyProfile>('/profile');
    return data;
  },
};
