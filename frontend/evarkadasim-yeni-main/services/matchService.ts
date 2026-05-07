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
  matchId: number;
  matchedUser: UserProfileDto;
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
    id: dto.matchId.toString(),
    user: {
      id: dto.matchedUser.id,
      name: dto.matchedUser.name,
      age: dto.matchedUser.age,
      bio: dto.matchedUser.bio ?? '',
      budget: dto.matchedUser.budget ?? '',
      moveInDate: dto.matchedUser.moveInDate ?? '',
      lifestyle: dto.matchedUser.lifestyle,
      photos: dto.matchedUser.photos,
      location: { city: dto.matchedUser.location?.city ?? '' },
      interests: dto.matchedUser.interests,
      occupation: dto.matchedUser.occupation,
      education: dto.matchedUser.education,
      roomType: 'any',
      lookingFor: dto.matchedUser.lookingFor === 'Room' ? 'room' : 'roommate',
      isVerified: dto.matchedUser.isVerified,
      lastActive: new Date(dto.matchedUser.lastActive),
      cleanliness: dto.matchedUser.cleanliness,
      socialLevel: dto.matchedUser.socialLevel,
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
