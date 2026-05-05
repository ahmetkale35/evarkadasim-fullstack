import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { userService } from '@/services/userService';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);

  const fetchFeed = useCallback(async (currentSkip: number) => {
    try {
      setError(null);
      const result = await userService.getFeed(currentSkip);
      setUsers(prev => currentSkip === 0 ? result.users : [...prev, ...result.users]);
      setHasMore(result.hasMore);
      setSkip(currentSkip + result.users.length);
    } catch {
      setError('Kullanıcılar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(0);
  }, [fetchFeed]);

  const removeUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    // Kart bitiminde sıradaki sayfa yüklenir
    if (users.length <= 3 && hasMore) {
      fetchFeed(skip);
    }
  };

  return { users, loading, error, removeUser };
}
