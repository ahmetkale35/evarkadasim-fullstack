export interface User {
  id: string;
  name: string;
  age: number;
  bio: string;
  budget: string;
  moveInDate: string;
  lifestyle: string[];
  photos: string[];
  location: {
    city: string;
    distance?: number;
  };
  interests: string[];
  occupation?: string;
  education?: string;
  roomType: 'private' | 'shared' | 'studio' | 'any';
  lookingFor: 'roommate' | 'room';
  isVerified: boolean;
  lastActive: Date;
  cleanliness: number; // 1-5 scale
  socialLevel: number; // 1-5 scale
  characterProfile?: TestResults;
  compatibility?: number | null;
  hasProperty?: boolean;
}

export interface TestResults {
  socialEnergy: number;        // İS1, İS2 (ters)
  orderApproach: number;       // İS3, İS4 (ters)
  conflictManagement: number;  // İS5, İS6 (ters)
  sharingStyle: number;        // İS7, İS8 (ters)
  lifeRhythm: number;         // İS9, İS10 (ters)
  communicationStyle: number;  // İS11, İS12 (ters)
}

export interface DetailedTestResults {
  // İskelet test sonuçları
  basicResults: TestResults;

  // Detaylı test sonuçları (her kategori için 6 soru)
  detailedSocialEnergy: number[];        // DS1-DS6
  detailedOrderApproach: number[];       // DS7-DS12
  detailedConflictManagement: number[];  // DS13-DS18
  detailedSharingStyle: number[];        // DS19-DS24
  detailedLifeRhythm: number[];          // DS25-DS30
  detailedCommunicationStyle: number[];  // DS31-DS36

  // Birleştirilmiş nihai skorlar
  finalScores: TestResults;

  // Kişilik tipi
  personalityType: string; // ESDHCX formatında
}

export interface Property {
  id: string;
  title: string;
  price: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  description: string;
  amenities: string[];
  availableFrom: Date;
  propertyType: 'apartment' | 'house' | 'studio' | 'shared';
  furnished: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  latitude?: number;
  longitude?: number;
  ownerId: string;
  ownerName: string;
}

export interface PropertyMapPin {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  price: string;
  location: string;
  propertyType: 'apartment' | 'house' | 'studio' | 'shared';
  ownerId: string;
  ownerName: string;
}

export interface Match {
  id: string;
  user: User;
  matchedAt: Date;
  lastMessage?: Message;
  isNewMatch: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'gif';
  isRead: boolean;
}

export interface Chat {
  id: string;
  matchId: string;
  messages: Message[];
  participants: User[];
}

export interface SwipeAction {
  userId: string;
  action: 'like' | 'pass' | 'superlike';
  timestamp: Date;
}