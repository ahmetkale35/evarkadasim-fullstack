import { Match, Message } from '@/types';
import { apiClient } from './apiClient';

// Backend MatchDto — UserProfileDto içeriğinden sadece feed'de gerekenleri alıyoruz
interface UserProfileDto {
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
  roomType?: string;
  lookingFor?: string;
  isVerified: boolean;
  lastActive: string;
  cleanliness: number;
  socialLevel: number;
}

interface MessageDto {
  id: number;
  senderId: string;
  content: string;
  timestamp: string;
  type: string;
  isRead: boolean;
}

interface MatchDto {
  id: string;
  user: UserProfileDto;
  matchedAt: string;
  lastMessage?: MessageDto;
  isNewMatch: boolean;
  compatibilityScore: number;
}

function toMessage(dto: MessageDto): Message {
  return {
    id: dto.id.toString(),
    senderId: dto.senderId,
    content: dto.content,
    timestamp: new Date(dto.timestamp),
    type: dto.type as Message['type'],
    isRead: dto.isRead,
  };
}

function toMatch(dto: MatchDto): Match {
  return {
    id: dto.id,
    user: {
      id: dto.user.id,
      name: dto.user.name,
      age: dto.user.age,
      bio: dto.user.bio ?? '',
      budget: dto.user.budget ?? '',
      moveInDate: dto.user.moveInDate ?? '',
      lifestyle: dto.user.lifestyle,
      photos: dto.user.photos,
      location: { city: dto.user.location?.city ?? '' },
      interests: dto.user.interests,
      occupation: dto.user.occupation,
      education: dto.user.education,
      roomType: 'any',
      lookingFor: 'both',
      isVerified: dto.user.isVerified,
      lastActive: new Date(dto.user.lastActive),
      cleanliness: dto.user.cleanliness,
      socialLevel: dto.user.socialLevel,
    },
    matchedAt: new Date(dto.matchedAt),
    lastMessage: dto.lastMessage ? toMessage(dto.lastMessage) : undefined,
    isNewMatch: dto.isNewMatch,
  };
}

export const matchService = {
  getMatches: async (): Promise<Match[]> => {
    const { data } = await apiClient.get<MatchDto[]>('/swipe/matches');
    return data.map(toMatch);
  },
};
