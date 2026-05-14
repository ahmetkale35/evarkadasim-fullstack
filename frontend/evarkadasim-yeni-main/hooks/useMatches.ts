import { useState, useEffect } from 'react';
import { Match, User } from '@/types';
import { matchService } from '@/services/matchService';
import { signalrService } from '@/services/signalrService';

interface MatchCreatedDto {
  matchId: string;
  matchedUser: {
    id: string;
    name: string;
    age: number;
    bio?: string;
    budget?: string;
    moveInDate?: string;
    lifestyle: string[];
    photos: string[];
    location?: { city: string; distance?: number };
    interests: string[];
    occupation?: string;
    education?: string;
    roomType?: string;
    lookingFor?: string;
    isVerified: boolean;
    lastActive: string;
    cleanliness: number;
    socialLevel: number;
    compatibility?: number;
    hasProperty: boolean;
  };
  matchedAt: string;
  isNewMatch: boolean;
}

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    matchService.getMatches()
      .then(setMatches)
      .catch(() => setError('Eşleşmeler yüklenemedi.'))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  const refetch = () => fetchMatches(true);

  useEffect(() => {
    fetchMatches();

    signalrService.start().catch(() => {});

    signalrService.on<MatchCreatedDto>('MatchCreated', (dto) => {
      const user: User = {
        id: dto.matchedUser.id,
        name: dto.matchedUser.name,
        age: dto.matchedUser.age,
        bio: dto.matchedUser.bio ?? '',
        budget: dto.matchedUser.budget ?? '',
        moveInDate: dto.matchedUser.moveInDate ?? '',
        lifestyle: dto.matchedUser.lifestyle,
        photos: dto.matchedUser.photos,
        location: dto.matchedUser.location ?? { city: '' },
        interests: dto.matchedUser.interests,
        occupation: dto.matchedUser.occupation,
        education: dto.matchedUser.education,
        roomType: (dto.matchedUser.roomType as User['roomType']) ?? 'any',
        lookingFor: (dto.matchedUser.lookingFor as User['lookingFor']) ?? 'roommate',
        isVerified: dto.matchedUser.isVerified,
        lastActive: new Date(dto.matchedUser.lastActive),
        cleanliness: dto.matchedUser.cleanliness,
        socialLevel: dto.matchedUser.socialLevel,
        compatibility: dto.matchedUser.compatibility,
        hasProperty: dto.matchedUser.hasProperty,
      };
      const newMatch: Match = {
        id: dto.matchId,
        user,
        matchedAt: new Date(dto.matchedAt),
        isNewMatch: dto.isNewMatch,
      };
      setMatches(prev => [newMatch, ...prev]);
    });

    return () => {
      signalrService.off('MatchCreated');
    };
  }, []);

  // Swipe ekranından anlık eşleşme geldiğinde listeye ekler; API'yi beklemeden UI güncellenir
  const addMatch = (user: User) => {
    const newMatch: Match = {
      id: Date.now().toString(),
      user,
      matchedAt: new Date(),
      isNewMatch: true,
    };
    setMatches(prev => [newMatch, ...prev]);
  };

  return { matches, loading, refreshing, error, addMatch, refetch };
}
