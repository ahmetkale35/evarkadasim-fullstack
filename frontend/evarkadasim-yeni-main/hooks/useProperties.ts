import { useState, useEffect } from 'react';
import { Property } from '@/types';

const sampleProperties: Property[] = [
  {
    id: '1',
    title: 'Modern 2BR Apartment in Manhattan',
    price: '$2,800/month',
    location: 'Upper East Side, Manhattan',
    bedrooms: 2,
    bathrooms: 1,
    images: [
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=600'
    ],
    description: 'Beautiful modern apartment with great natural light, updated kitchen, and close to subway.',
    amenities: ['Laundry in unit', 'Dishwasher', 'Air conditioning', 'Elevator'],
    availableFrom: new Date('2025-03-01'),
    propertyType: 'apartment',
    furnished: false,
    petsAllowed: false,
    smokingAllowed: false
  },
  {
    id: '2',
    title: 'Cozy Studio in Brooklyn',
    price: '$1,600/month',
    location: 'Williamsburg, Brooklyn',
    bedrooms: 0,
    bathrooms: 1,
    images: [
      'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1571471/pexels-photo-1571471.jpeg?auto=compress&cs=tinysrgb&w=600'
    ],
    description: 'Charming studio apartment in trendy Williamsburg. Perfect for young professionals.',
    amenities: ['Hardwood floors', 'High ceilings', 'Near L train'],
    availableFrom: new Date('2025-02-15'),
    propertyType: 'studio',
    furnished: true,
    petsAllowed: true,
    smokingAllowed: false
  },
  {
    id: '3',
    title: 'Spacious 3BR House Share',
    price: '$1,200/month per room',
    location: 'Astoria, Queens',
    bedrooms: 3,
    bathrooms: 2,
    images: [
      'https://images.pexels.com/photos/1571467/pexels-photo-1571467.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=600'
    ],
    description: 'Large house with backyard, looking for 2 more roommates. Great for professionals.',
    amenities: ['Backyard', 'Parking', 'Washer/Dryer', 'Kitchen island'],
    availableFrom: new Date('2025-04-01'),
    propertyType: 'house',
    furnished: false,
    petsAllowed: true,
    smokingAllowed: false
  }
];

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setProperties(sampleProperties);
      setLoading(false);
    }, 800);
  }, []);

  return { properties, loading };
}