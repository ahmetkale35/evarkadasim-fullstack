import { useState, useEffect } from 'react';
import { profileService, MyProfile } from '@/services/profileService';

export function useProfile() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileService.getMyProfile()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { profile, loading };
}
