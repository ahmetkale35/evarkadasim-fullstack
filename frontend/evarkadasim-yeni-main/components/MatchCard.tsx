import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageCircle, EggFried as Verified, Home, Search, MapPin } from 'lucide-react-native';
import { Match } from '@/types';

function UserTypeBadge({ lookingFor }: { lookingFor: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, marginTop: 3 }}>
      {lookingFor === 'roommate' && (
        <View style={[badgeStyles.badge, badgeStyles.ownerBadge]}>
          <Home size={10} color="#059669" />
          <Text style={[badgeStyles.text, { color: '#059669' }]}>Ev Sahibi</Text>
        </View>
      )}
      {lookingFor === 'room' && (
        <View style={[badgeStyles.badge, badgeStyles.seekerBadge]}>
          <Search size={10} color="#7C3AED" />
          <Text style={[badgeStyles.text, { color: '#7C3AED' }]}>Ev Arıyor</Text>
        </View>
      )}
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ownerBadge: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#6EE7B7' },
  seekerBadge: { backgroundColor: '#F3E8FF', borderWidth: 1, borderColor: '#C4B5FD' },
  text: { fontSize: 10, fontWeight: '600' },
});

interface MatchCardProps {
  match: Match;
  onPress: () => void;
}

export function MatchCard({ match, onPress }: MatchCardProps) {
  const { user, lastMessage, isNewMatch } = match;
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: user.photos[0] }} style={styles.image} />
        {isNewMatch && <View style={styles.newMatchBadge} />}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.name}</Text>
              {user.isVerified && <Verified size={16} color="#3B82F6" fill="#3B82F6" />}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <UserTypeBadge lookingFor={user.lookingFor} />
              {user.location?.city ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <MapPin size={10} color="#9CA3AF" />
                  <Text style={{ fontSize: 10, color: '#9CA3AF' }}>{user.location.city}</Text>
                </View>
              ) : null}
            </View>
          </View>
          {lastMessage && <Text style={styles.time}>{formatTime(lastMessage.timestamp)}</Text>}
        </View>

        <View style={styles.messageRow}>
          {lastMessage ? (
            <Text style={[styles.message, !lastMessage.isRead && styles.unread]} numberOfLines={1}>
              {lastMessage.content}
            </Text>
          ) : (
            <Text style={styles.newMatchText}>Say hello! 👋</Text>
          )}
          
          <MessageCircle size={16} color="#9CA3AF" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  newMatchBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EC4899',
    borderWidth: 2,
    borderColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 4,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    marginRight: 8,
  },
  unread: {
    color: '#111827',
    fontWeight: '500',
  },
  newMatchText: {
    fontSize: 14,
    color: '#EC4899',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
});