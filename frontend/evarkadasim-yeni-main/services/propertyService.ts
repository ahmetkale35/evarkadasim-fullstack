import { Property } from '@/types';
import { apiClient } from './apiClient';

interface PropertyDto {
  id: number;
  title: string;
  price: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  description?: string;
  amenities: string[];
  availableFrom: string;
  // JsonStringEnumConverter: "Apartment" | "Studio" | "House" | "Room"
  propertyType: 'Apartment' | 'Studio' | 'House' | 'Room';
  furnished: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  ownerId: string;
  ownerName: string;
}

// Backend "Room" (oda kiralama) → frontend "shared" (en yakın karşılık)
function mapPropertyType(val: string): Property['propertyType'] {
  const map: Record<string, Property['propertyType']> = {
    Apartment: 'apartment',
    Studio: 'studio',
    House: 'house',
    Room: 'shared',
  };
  return map[val] ?? 'apartment';
}

function toProperty(dto: PropertyDto): Property {
  return {
    id: dto.id.toString(),
    title: dto.title,
    price: dto.price,
    location: dto.location,
    bedrooms: dto.bedrooms,
    bathrooms: dto.bathrooms,
    images: dto.images,
    description: dto.description ?? '',
    amenities: dto.amenities,
    availableFrom: new Date(dto.availableFrom),
    propertyType: mapPropertyType(dto.propertyType),
    furnished: dto.furnished,
    petsAllowed: dto.petsAllowed,
    smokingAllowed: dto.smokingAllowed,
  };
}

export const propertyService = {
  getList: async (skip = 0, take = 20): Promise<Property[]> => {
    const { data } = await apiClient.get<PropertyDto[]>('/property', { params: { skip, take } });
    return data.map(toProperty);
  },
};
