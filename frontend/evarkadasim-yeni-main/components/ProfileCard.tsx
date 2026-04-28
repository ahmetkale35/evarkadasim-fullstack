import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Shield as Verified, Heart, X, Star, DollarSign, Calendar, Chrome as Home, Sparkles } from 'lucide-react-native';
import { User } from '@/types';

interface ProfileCardProps {
  user: User;
  compatibility?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const cardWidth = screenWidth * 0.9;
const cardHeight = screenHeight * 0.72;

export function ProfileCard({ user, compatibility }: ProfileCardProps) {
  const getCompatibilityColor = (score?: number) => {
    if (!score) return '#D1D5DB';
    if (score >= 90) return '#10B981'; // Yeşil
    if (score >= 75) return '#F59E0B'; // Amber
    if (score >= 60) return '#EC4899'; // Pink
    return '#EF4444'; // Kırmızı
  };

  const getCompatibilityText = (score?: number) => {
    if (!score) return 'Yeni';
    if (score >= 90) return 'Mükemmel Uyum';
    if (score >= 75) return 'Çok Uyumlu';
    if (score >= 60) return 'Uyumlu';
    return 'Orta Uyum';
  };

  return (
    <View style={styles.card}>
      <Image source={{ uri: user.photos[0] }} style={styles.image} />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.9)']}
        style={styles.gradient}
      />

      {/* Uyumluluk badgesi - sağ üst köşe */}
      {compatibility !== undefined && (
        <View style={styles.compatibilityBadge}>
          <LinearGradient
            colors={[getCompatibilityColor(compatibility), getCompatibilityColor(compatibility)]}
            style={styles.compatibilityGradient}
          >
            <View style={styles.compatibilityContent}>
              <Sparkles size={12} color="#fff" />
              <Text style={styles.compatibilityPercentage}>%{compatibility}</Text>
            </View>
            <Text style={styles.compatibilityText}>
              {getCompatibilityText(compatibility)}
            </Text>
          </LinearGradient>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
            {user.isVerified && (
              <Verified size={18} color="#3B82F6" fill="#3B82F6" />
            )}
          </View>

          <View style={styles.locationRow}>
            <MapPin size={12} color="#D1D5DB" />
            <Text style={styles.location}>{user.location.city}</Text>
            {user.location.distance && (
              <Text style={styles.distance}>• {user.location.distance} km away</Text>
            )}
          </View>
        </View>

        <View style={styles.quickInfo}>
          <View style={styles.infoItem}>
            <DollarSign size={14} color="#10B981" />
            <Text style={styles.infoText}>{user.budget}</Text>
          </View>
          <View style={styles.infoItem}>
            <Calendar size={14} color="#8B5CF6" />
            <Text style={styles.infoText}>{user.moveInDate}</Text>
          </View>
          <View style={styles.infoItem}>
            <Home size={14} color="#EC4899" />
            <Text style={styles.infoText}>{user.roomType} room</Text>
          </View>
        </View>

        <Text style={styles.bio}>
          {user.bio}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifestyle</Text>
          <View style={styles.tags}>
            {user.lifestyle.map((item, index) => (
              <View key={index} style={styles.lifestyleTag}>
                <Text style={styles.tagText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.tags}>
            {user.interests.slice(0, 4).map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.tagText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.compatibilitySection}>
          <Text style={styles.sectionTitle}>Compatibility</Text>
          <View style={styles.compatibilityRow}>
            <Text style={styles.compatibilityLabel}>Cleanliness</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text key={star} style={[styles.star, star <= user.cleanliness && styles.activeStar]}>★</Text>
              ))}
            </View>
          </View>
          <View style={styles.compatibilityRow}>
            <Text style={styles.compatibilityLabel}>Social Level</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text key={star} style={[styles.star, star <= user.socialLevel && styles.activeStar]}>★</Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    height: cardHeight,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '45%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  compatibilityBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  compatibilityGradient: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  compatibilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  compatibilityPercentage: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 4,
  },
  compatibilityText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  distance: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  quickInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  infoText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  bio: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  lifestyleTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  interestTag: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EC4899',
  },
  tagText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },
  compatibilitySection: {
    marginBottom: 16,
  },
  compatibilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compatibilityLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 16,
    color: '#E5E7EB',
    marginLeft: 2,
  },
  activeStar: {
    color: '#FBBF24',
  },
  bottomPadding: {
    height: 20,
  },
});