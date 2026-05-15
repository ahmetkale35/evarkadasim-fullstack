import { Property, PropertyMapPin } from '@/types';
import { apiClient } from './apiClient';

interface PropertyDto {
  id: number;
  title: string;
  price: string;
  priceAmount: number;
  currency: string;
  pricePeriod: string;
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
  latitude?: number;
  longitude?: number;
  ownerId: string;
  ownerName: string;
}

interface PropertyMapPinDto {
  id: number;
  latitude: number;
  longitude: number;
  title: string;
  price: string;
  location: string;
  propertyType: 'Apartment' | 'Studio' | 'House' | 'Room';
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
    latitude: dto.latitude,
    longitude: dto.longitude,
    ownerId: dto.ownerId,
    ownerName: dto.ownerName,
  };
}

function toMapPin(dto: PropertyMapPinDto): PropertyMapPin {
  return {
    id: dto.id.toString(),
    latitude: dto.latitude,
    longitude: dto.longitude,
    title: dto.title,
    price: dto.price,
    location: dto.location,
    propertyType: mapPropertyType(dto.propertyType),
    ownerId: dto.ownerId,
    ownerName: dto.ownerName,
  };
}

export interface PropertyFormData {
  title: string;
  location: string;
  priceAmount: number;
  currency: string;
  pricePeriod: string;
  bedrooms: number;
  bathrooms: number;
  propertyType: 'Apartment' | 'Studio' | 'House' | 'Room';
  furnished: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  description: string;
  availableFrom: string;
  images?: string[];
  latitude?: number;
  longitude?: number;
}

export { PropertyDto };

export const propertyService = {
  getList: async (skip = 0, take = 20): Promise<Property[]> => {
    const { data } = await apiClient.get<PropertyDto[]>('/property', { params: { skip, take } });
    return data.map(toProperty);
  },

  getMapPins: async (city?: string): Promise<PropertyMapPin[]> => {
    const { data } = await apiClient.get<PropertyMapPinDto[]>('/property/map', {
      params: city ? { city } : undefined,
    });
    return data.map(toMapPin);
  },

  getMine: async (): Promise<PropertyDto | null> => {
    const { data, status } = await apiClient.get<PropertyDto>('/property/mine', {
      validateStatus: (s) => s === 200 || s === 204,
    });
    return status === 204 ? null : data;
  },

  create: async (form: PropertyFormData): Promise<PropertyDto> => {
    const { data } = await apiClient.post<PropertyDto>('/property', {
      title: form.title,
      priceAmount: form.priceAmount,
      currency: form.currency,
      pricePeriod: form.pricePeriod,
      location: form.location,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      propertyType: form.propertyType,
      furnished: form.furnished,
      petsAllowed: form.petsAllowed,
      smokingAllowed: form.smokingAllowed,
      description: form.description,
      availableFrom: form.availableFrom,
      images: form.images ?? [],
      amenities: [],
      latitude: form.latitude,
      longitude: form.longitude,
    });
    return data;
  },

  update: async (id: number, form: PropertyFormData): Promise<PropertyDto> => {
    const { data } = await apiClient.put<PropertyDto>(`/property/${id}`, {
      title: form.title,
      priceAmount: form.priceAmount,
      currency: form.currency,
      pricePeriod: form.pricePeriod,
      location: form.location,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      propertyType: form.propertyType,
      furnished: form.furnished,
      petsAllowed: form.petsAllowed,
      smokingAllowed: form.smokingAllowed,
      description: form.description,
      availableFrom: form.availableFrom,
      images: form.images ?? [],
      amenities: [],
      latitude: form.latitude,
      longitude: form.longitude,
    });
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/property/${id}`);
  },

  deleteMine: async (): Promise<void> => {
    await apiClient.delete('/property/mine');
  },
};
