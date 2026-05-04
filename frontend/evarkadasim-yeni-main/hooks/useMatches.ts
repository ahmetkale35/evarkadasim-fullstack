import { useState, useEffect } from 'react';
import { Match, User } from '@/types';
import { matchService } from '@/services/matchService';

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    matchService.getMatches()
      .then(setMatches)
      .catch(() => setError('Eşleşmeler yüklenemedi.'))
      .finally(() => setLoading(false));
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

  return { matches, loading, error, addMatch };
}
