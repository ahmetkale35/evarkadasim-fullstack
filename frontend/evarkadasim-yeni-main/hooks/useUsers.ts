import { useState, useEffect } from 'react';
import { User, TestResults } from '@/types';

// Sample data for demonstration
const sampleUsers: User[] = [
  {
    id: '1',
    name: 'Emma',
    age: 26,
    bio: 'Clean, organized professional looking for a like-minded roommate. Love cooking and quiet evenings at home.',
    budget: '$800-1200/month',
    moveInDate: 'March 2025',
    lifestyle: ['Non-smoker', 'No pets', 'Quiet', 'Clean'],
    photos: [
      'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=600'
    ],
    location: { city: 'New York', distance: 3 },
    interests: ['Yoga', 'Reading', 'Cooking', 'Netflix'],
    occupation: 'Graphic Designer',
    education: 'NYU',
    roomType: 'private',
    lookingFor: 'roommate',
    isVerified: true,
    lastActive: new Date(),
    cleanliness: 5,
    socialLevel: 3,
    characterProfile: {
      socialEnergy: 2.5,
      orderApproach: 4.5,
      conflictManagement: 4.0,
      sharingStyle: 3.5,
      lifeRhythm: 4.0,
      communicationStyle: 3.0
    }
  },
  {
    id: '2',
    name: 'Sofia',
    age: 24,
    bio: 'Music teacher seeking a creative roommate. I practice piano but always use headphones after 8pm!',
    budget: '$600-900/month',
    moveInDate: 'April 2025',
    lifestyle: ['Pet-friendly', 'Social', 'Creative', 'Flexible'],
    photos: [
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1542085/pexels-photo-1542085.jpeg?auto=compress&cs=tinysrgb&w=600'
    ],
    location: { city: 'Brooklyn', distance: 7 },
    interests: ['Music', 'Art', 'Coffee shops', 'Weekend trips'],
    occupation: 'Music Teacher',
    education: 'Berklee',
    roomType: 'shared',
    lookingFor: 'room',
    isVerified: true,
    lastActive: new Date(),
    cleanliness: 4,
    socialLevel: 4,
    characterProfile: {
      socialEnergy: 4.0,
      orderApproach: 3.0,
      conflictManagement: 3.5,
      sharingStyle: 4.5,
      lifeRhythm: 2.5,
      communicationStyle: 4.0
    }
  },
  {
    id: '3',
    name: 'Maya',
    age: 28,
    bio: 'Fitness enthusiast and food blogger. Early riser who loves meal prep and keeping a tidy space.',
    budget: '$1000-1500/month',
    moveInDate: 'February 2025',
    lifestyle: ['Early riser', 'Fitness focused', 'Organized', 'Health conscious'],
    photos: [
      'https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=600'
    ],
    location: { city: 'Manhattan', distance: 5 },
    interests: ['Fitness', 'Healthy cooking', 'Photography', 'Meditation'],
    occupation: 'Content Creator',
    education: 'Columbia',
    roomType: 'private',
    lookingFor: 'both',
    isVerified: false,
    lastActive: new Date(),
    cleanliness: 5,
    socialLevel: 3,
    characterProfile: {
      socialEnergy: 3.0,
      orderApproach: 5.0,
      conflictManagement: 4.5,
      sharingStyle: 3.0,
      lifeRhythm: 4.5,
      communicationStyle: 3.5
    }
  },
  {
    id: '4',
    name: 'Alex',
    age: 25,
    bio: 'Software developer who works from home. Looking for a chill roommate who respects personal space.',
    budget: '$900-1300/month',
    moveInDate: 'March 2025',
    lifestyle: ['Non-smoker', 'Tech enthusiast', 'Gamer', 'Flexible hours'],
    photos: [
      'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=600'
    ],
    location: { city: 'Queens', distance: 4 },
    interests: ['Coding', 'Gaming', 'Movies', 'Hiking'],
    occupation: 'Software Developer',
    education: 'MIT',
    roomType: 'private',
    lookingFor: 'roommate',
    isVerified: true,
    lastActive: new Date(),
    cleanliness: 4,
    socialLevel: 2,
    characterProfile: {
      socialEnergy: 2.0,
      orderApproach: 3.5,
      conflictManagement: 3.0,
      sharingStyle: 2.5,
      lifeRhythm: 3.0,
      communicationStyle: 2.5
    }
  },
  {
    id: '5',
    name: 'Jordan',
    age: 27,
    bio: 'Art student seeking creative living space. Open to shared rooms and collaborative environments.',
    budget: '$500-800/month',
    moveInDate: 'April 2025',
    lifestyle: ['Pet-friendly', 'Artistic', 'Social', 'Vegetarian'],
    photos: [
      'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=600'
    ],
    location: { city: 'Brooklyn', distance: 6 },
    interests: ['Painting', 'Photography', 'Music festivals', 'Vegan cooking'],
    occupation: 'Art Student',
    education: 'Pratt Institute',
    roomType: 'shared',
    lookingFor: 'room',
    isVerified: false,
    lastActive: new Date(),
    cleanliness: 3,
    socialLevel: 5
    // Bu kullanıcının karakter profili yok - random oluşturulacak
  },
  {
    id: '6',
    name: 'Taylor',
    age: 29,
    bio: 'Marketing professional who travels often. Need a reliable roommate for a modern apartment.',
    budget: '$1100-1600/month',
    moveInDate: 'February 2025',
    lifestyle: ['Traveler', 'Professional', 'Clean', 'Fitness'],
    photos: [
      'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=600'
    ],
    location: { city: 'Manhattan', distance: 2 },
    interests: ['Travel', 'Networking', 'Gym', 'Podcasts'],
    occupation: 'Marketing Manager',
    education: 'NYU Stern',
    roomType: 'private',
    lookingFor: 'both',
    isVerified: true,
    lastActive: new Date(),
    cleanliness: 5,
    socialLevel: 4,
    characterProfile: {
      socialEnergy: 3.5,
      orderApproach: 4.0,
      conflictManagement: 4.5,
      sharingStyle: 3.0,
      lifeRhythm: 3.5,
      communicationStyle: 4.0
    }
  }
];

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUsers(sampleUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const removeUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  return { users, loading, removeUser };
}