import { useState, useEffect, useCallback } from 'react';
import { profileService, MyProfile } from '@/services/profileService';

export function useProfile() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    profileService.getMyProfile()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { profile, loading, refresh: load };
}
