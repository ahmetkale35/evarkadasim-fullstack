import { useState, useEffect } from 'react';
import { PropertyMapPin } from '@/types';
import { propertyService } from '@/services/propertyService';
import { propertyEvents } from '@/services/propertyEvents';

export function usePropertyMapPins(city?: string) {
  const [pins, setPins] = useState<PropertyMapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    return propertyEvents.onRefreshNeeded(() => setTick(t => t + 1));
  }, []);

  useEffect(() => {
    propertyService.getMapPins(city)
      .then(setPins)
      .catch(() => setError('Harita verileri yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [city, tick]);

  return { pins, loading, error };
}
