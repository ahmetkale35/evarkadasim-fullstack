import { User } from '@/types';
import { apiClient } from './apiClient';

// Backend'den gelen ham DTO tipi (JsonStringEnumConverter PascalCase string döndürür)
interface UserSummaryDto {
  id: string;
  name: string;
  age: number;
  bio?: string;
  budget?: string;
  moveInDate?: string;
  lifestyle: string[];
  photos: string[];
  location?: { city?: string; distance: number };
  interests: string[];
  occupation?: string;
  education?: string;
  roomType?: 'Private' | 'Shared' | 'Studio';
  lookingFor?: 'Roommate' | 'Room';
  hasProperty?: boolean;
  isVerified: boolean;
  lastActive: string;
  cleanliness: number;
  socialLevel: number;
  compatibility?: number;
}

interface PagedFeedDto {
  users: UserSummaryDto[];
  skip: number;
  take: number;
  totalCount: number;
  hasMore: boolean;
}

interface SwipeResultDto {
  isMatch: boolean;
  matchedUserId?: string;
  message: string;
}

// PascalCase enum değerlerini frontend'in beklediği lowercase union tiplerine çevirir
function mapRoomType(val?: string): User['roomType'] {
  const map: Record<string, User['roomType']> = {
    Private: 'private',
    Shared: 'shared',
    Studio: 'studio',
  };
  return (val && map[val]) || 'any';
}

function mapLookingFor(val?: string): User['lookingFor'] {
  const map: Record<string, User['lookingFor']> = {
    Roommate: 'roommate',
    Room: 'room',
  };
  return (val && map[val]) || 'roommate';
}

function toUser(dto: UserSummaryDto): User {
  return {
    id: dto.id,
    name: dto.name,
    age: dto.age,
    bio: dto.bio ?? '',
    budget: dto.budget ?? '',
    moveInDate: dto.moveInDate ?? '',
    lifestyle: dto.lifestyle,
    photos: dto.photos,
    location: { city: dto.location?.city ?? '', distance: dto.location?.distance },
    interests: dto.interests,
    occupation: dto.occupation,
    education: dto.education,
    roomType: mapRoomType(dto.roomType),
    lookingFor: mapLookingFor(dto.lookingFor),
    hasProperty: dto.hasProperty ?? false,
    isVerified: dto.isVerified,
    lastActive: new Date(dto.lastActive),
    cleanliness: dto.cleanliness,
    socialLevel: dto.socialLevel,
    compatibility: dto.compatibility !== undefined ? dto.compatibility : undefined,
  };
}

export const userService = {
  getFeed: async (skip = 0, take = 20): Promise<{ users: User[]; hasMore: boolean }> => {
    const { data } = await apiClient.get<PagedFeedDto>('/users', { params: { skip, take } });
    return {
      users: data.users.map(toUser),
      hasMore: data.hasMore,
    };
  },

  getById: async (targetId: string): Promise<User | null> => {
    try {
      const { data } = await apiClient.get<UserSummaryDto>(`/users/${targetId}`);
      return toUser(data);
    } catch {
      return null;
    }
  },

  swipe: async (receiverId: string, action: 'like' | 'pass' | 'superlike'): Promise<SwipeResultDto> => {
    // Frontend lowercase → backend PascalCase
    const swipeTypeMap: Record<string, string> = {
      like: 'Like',
      pass: 'Pass',
      superlike: 'SuperLike',
    };
    const { data } = await apiClient.post<SwipeResultDto>('/swipe', {
      receiverId,
      swipeType: swipeTypeMap[action],
    });
    return data;
  },
};
