import { useState, useEffect } from 'react';
import { Property } from '@/types';
import { propertyService } from '@/services/propertyService';

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    propertyService.getList()
      .then(setProperties)
      .catch(() => setError('İlanlar yüklenemedi.'))
      .finally(() => setLoading(false));
  }, []);

  return { properties, loading, error };
}
