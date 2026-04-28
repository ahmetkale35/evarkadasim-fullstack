import { useState, useEffect } from 'react';
import { Match, User } from '@/types';

const sampleMatches: Match[] = [
  {
    id: '1',
    user: {
      id: '1',
      name: 'Emma',
      age: 26,
      bio: 'Clean, organized professional looking for a roommate',
      budget: '$800-1200/month',
      moveInDate: 'March 2025',
      lifestyle: ['Non-smoker', 'Clean'],
      photos: ['https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600'],
      location: { city: 'New York', distance: 3 },
      interests: ['Yoga', 'Reading'],
      roomType: 'private',
      lookingFor: 'roommate',
      isVerified: true,
      lastActive: new Date(),
      cleanliness: 5,
      socialLevel: 3
    },
    matchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    lastMessage: {
      id: '1',
      senderId: '1',
      content: 'Hi! I saw your profile and think we might be compatible roommates!',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      type: 'text',
      isRead: false
    },
    isNewMatch: false
  },
  {
    id: '2',
    user: {
      id: '2',
      name: 'Sofia',
      age: 24,
      bio: 'Music teacher seeking a creative roommate',
      budget: '$600-900/month',
      moveInDate: 'April 2025',
      lifestyle: ['Pet-friendly', 'Social'],
      photos: ['https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600'],
      location: { city: 'Brooklyn', distance: 7 },
      interests: ['Music', 'Art'],
      roomType: 'shared',
      lookingFor: 'room',
      isVerified: true,
      lastActive: new Date(),
      cleanliness: 4,
      socialLevel: 4
    },
    matchedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    isNewMatch: true
  }
];

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setMatches(sampleMatches);
      setLoading(false);
    }, 800);
  }, []);

  const addMatch = (user: User) => {
    const newMatch: Match = {
      id: Date.now().toString(),
      user,
      matchedAt: new Date(),
      isNewMatch: true
    };
    setMatches(prev => [newMatch, ...prev]);
  };

  return { matches, loading, addMatch };
}