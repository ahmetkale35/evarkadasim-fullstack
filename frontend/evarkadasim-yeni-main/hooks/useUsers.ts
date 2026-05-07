import { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { User } from '@/types';
import { userService } from '@/services/userService';
import { feedEvents } from '@/services/feedEvents';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  // Logout → remount sıfırlar; tab geçişinde tekrar yüklenmez
  const didLoad = useRef(false);
  const usersRef = useRef(users);
  usersRef.current = users;

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

  useFocusEffect(
    useCallback(() => {
      if (didLoad.current && usersRef.current.length > 0) return;
      didLoad.current = true;
      setLoading(true);
      fetchFeed(0);
    }, [fetchFeed])
  );

  const removeUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (users.length <= 3 && hasMore) {
      fetchFeed(skip);
    }
  };

  const refresh = useCallback(() => {
    didLoad.current = false;
    setSkip(0);
    setLoading(true);
    return fetchFeed(0);
  }, [fetchFeed]);

  useEffect(() => {
    return feedEvents.onRefreshNeeded(() => {
      refresh();
    });
  }, [refresh]);

  return { users, loading, error, removeUser, refresh };
}
