import { useState, useEffect } from 'react';
import { PropertyMapPin } from '@/types';
import { propertyService } from '@/services/propertyService';

export function usePropertyMapPins(city?: string) {
  const [pins, setPins] = useState<PropertyMapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    propertyService.getMapPins(city)
      .then(setPins)
      .catch(() => setError('Harita verileri yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [city]);

  return { pins, loading, error };
}
