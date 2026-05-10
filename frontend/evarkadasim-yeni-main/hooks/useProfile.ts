import { useState, useEffect, useCallback } from 'react';
import { profileService, MyProfile } from '@/services/profileService';
import { profileEvents } from '@/services/profileEvents';

export function useProfile() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    profileService.getMyProfile()
      .then(setProfile)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => profileEvents.onRefreshNeeded(load), [load]);

  return { profile, loading, error, refresh: load };
}
