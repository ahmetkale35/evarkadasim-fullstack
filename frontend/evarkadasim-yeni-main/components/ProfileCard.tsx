import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Shield as Verified, Star, DollarSign, Calendar, Chrome as Home, Sparkles, Search, Lock } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { User } from '@/types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const IMAGE_H = SCREEN_H * 0.28;
const SWIPE_THRESHOLD = SCREEN_W * 0.28;

interface ProfileCardProps {
  user: User;
  compatibility?: number | null;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onLockPress?: () => void;
}

export function ProfileCard({ user, compatibility, onSwipeLeft, onSwipeRight, onSwipeUp, onLockPress }: ProfileCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const swiped = useRef(false);
  const hintOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (!swipable) return;
    hintOpacity.value = withDelay(
      600,
      withSequence(
        withTiming(1, { duration: 400 }),
        withDelay(1400, withTiming(0, { duration: 500 }))
      )
    );
  }, []);

  const swipable = !!(onSwipeLeft || onSwipeRight);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (swiped.current) return;
      const { translationX, translationY, velocityX } = e;

      if (onSwipeUp && translationY < -100 && Math.abs(translationX) < 60) {
        swiped.current = true;
        translateY.value = withSpring(-SCREEN_H, { damping: 15 });
        runOnJS(onSwipeUp)();
        return;
      }

      if (Math.abs(translationX) > SWIPE_THRESHOLD || Math.abs(velocityX) > 500) {
        swiped.current = true;
        const dir = translationX > 0 ? 1 : -1;
        translateX.value = withSpring(dir * SCREEN_W * 1.5, { damping: 15 });
        if (dir > 0 && onSwipeRight) runOnJS(onSwipeRight)();
        else if (dir < 0 && onSwipeLeft) runOnJS(onSwipeLeft)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardAnim = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-SCREEN_W / 2, 0, SCREEN_W / 2], [-12, 0, 12]);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const nopeAnim = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.5, -20], [1, 0], 'clamp'),
  }));

  const likeAnim = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [20, SWIPE_THRESHOLD * 0.5], [0, 1], 'clamp'),
  }));

  const superAnim = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [-120, -40], [1, 0], 'clamp'),
  }));

  const hintAnim = useAnimatedStyle(() => ({ opacity: hintOpacity.value }));

  const getCompatibilityColor = (score?: number) => {
    if (!score) return '#D1D5DB';
    if (score >= 90) return '#10B981';
    if (score >= 75) return '#F59E0B';
    if (score >= 60) return '#EC4899';
    return '#EF4444';
  };

  const getCompatibilityText = (score?: number) => {
    if (!score) return 'Yeni';
    if (score >= 90) return 'Mükemmel Uyum';
    if (score >= 75) return 'Çok Uyumlu';
    if (score >= 60) return 'Uyumlu';
    return 'Orta Uyum';
  };


  const imageSection = (
    <View style={styles.imageContainer}>
      {user.photos.length > 0 ? (
        <Image source={{ uri: user.photos[0] }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.65)']}
        style={styles.imageGradient}
      />

      {/* Swipe hint */}
      {swipable && (
        <Animated.View style={[styles.swipeHint, hintAnim]} pointerEvents="none">
          <Text style={styles.swipeHintText}>← kaydır →</Text>
        </Animated.View>
      )}

      {/* İsim + konum resmin üzerinde */}
      <View style={styles.imageInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.imageName}>{user.name}, {user.age}</Text>
          {user.isVerified && <Verified size={18} color="#fff" fill="#fff" />}
        </View>
        <View style={styles.locationRow}>
          <MapPin size={13} color="rgba(255,255,255,0.85)" />
          <Text style={styles.imageLocation}>{user.location.city}</Text>
          {user.location.distance && (
            <Text style={styles.imageDistance}>• {user.location.distance} km</Text>
          )}
        </View>
      </View>

      {/* Uyumluluk badge — sağ üst */}
      {compatibility !== undefined && (
        compatibility === null ? (
          <TouchableOpacity style={styles.compatBadge} onPress={onLockPress} activeOpacity={0.75}>
            <View style={styles.lockGradient}>
              <Lock size={13} color="#fff" />
              <Text style={styles.lockLabel}>?%</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.compatBadge}>
            <LinearGradient
              colors={[getCompatibilityColor(compatibility), getCompatibilityColor(compatibility)]}
              style={styles.compatGradient}
            >
              <Sparkles size={11} color="#fff" />
              <Text style={styles.compatPct}>%{compatibility}</Text>
              <Text style={styles.compatLabel}>{getCompatibilityText(compatibility)}</Text>
            </LinearGradient>
          </View>
        )
      )}

      {/* Swipe badge'leri */}
      {swipable && (
        <>
          <Animated.View style={[styles.nopeBadge, nopeAnim]}>
            <Text style={styles.nopeBadgeText}>NOPE</Text>
          </Animated.View>
          <Animated.View style={[styles.likeBadge, likeAnim]}>
            <Text style={styles.likeBadgeText}>LIKE</Text>
          </Animated.View>
          {onSwipeUp && (
            <Animated.View style={[styles.superBadge, superAnim]}>
              <Text style={styles.superBadgeText}>SUPER LIKE ⭐</Text>
            </Animated.View>
          )}
        </>
      )}
    </View>
  );

  return (
    <Animated.View style={[styles.card, swipable && cardAnim]}>
      {swipable ? (
        <GestureDetector gesture={gesture}>
          {imageSection}
        </GestureDetector>
      ) : (
        imageSection
      )}

      <ScrollView
        style={styles.infoScroll}
        contentContainerStyle={styles.infoContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* Kullanıcı tipi */}
        <View style={styles.typeBadgeRow}>
          {user.lookingFor === 'roommate' && user.hasProperty && (
            <View style={[styles.typeBadge, styles.ownerTypeBadge]}>
              <Home size={12} color="#059669" />
              <Text style={[styles.typeBadgeText, { color: '#059669' }]}>Ev Sahibi</Text>
            </View>
          )}
          {user.lookingFor === 'room' && (
            <View style={[styles.typeBadge, styles.seekerTypeBadge]}>
              <Search size={12} color="#7C3AED" />
              <Text style={[styles.typeBadgeText, { color: '#7C3AED' }]}>Ev Arıyor</Text>
            </View>
          )}
        </View>

        {/* Hızlı bilgiler */}
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

        <Text style={styles.bio}>{user.bio}</Text>

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
            {user.interests.slice(0, 6).map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.tagText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compatibility</Text>
          <View style={styles.compatRow}>
            <Text style={styles.compatRowLabel}>Cleanliness</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Text key={s} style={[styles.star, s <= user.cleanliness && styles.activeStar]}>★</Text>
              ))}
            </View>
          </View>
          <View style={styles.compatRow}>
            <Text style={styles.compatRowLabel}>Social Level</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Text key={s} style={[styles.star, s <= user.socialLevel && styles.activeStar]}>★</Text>
              ))}
            </View>
          </View>
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },

  // Image
  imageContainer: { height: IMAGE_H, backgroundColor: '#E5E7EB' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { backgroundColor: '#E5E7EB' },
  imageGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: IMAGE_H * 0.55,
  },
  imageInfo: { position: 'absolute', bottom: 16, left: 20, right: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  imageName: { fontSize: 26, fontWeight: '800', color: '#fff' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  imageLocation: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  imageDistance: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },

  // Uyumluluk badge
  compatBadge: {
    position: 'absolute', top: 16, right: 16,
    borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  compatGradient: {
    paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center', minWidth: 78, gap: 2,
  },
  compatPct: { fontSize: 16, fontWeight: '800', color: '#fff' },
  compatLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  lockGradient: {
    paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center', minWidth: 78, gap: 3,
    backgroundColor: 'rgba(17,24,39,0.75)', borderRadius: 14,
  },
  lockLabel: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Swipe badge'ler
  nopeBadge: {
    position: 'absolute', top: 28, right: 20,
    borderWidth: 4, borderColor: '#EF4444', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8,
    transform: [{ rotate: '18deg' }],
    backgroundColor: 'rgba(239,68,68,0.18)',
  },
  nopeBadgeText: { fontSize: 26, fontWeight: '900', color: '#EF4444', letterSpacing: 2 },
  likeBadge: {
    position: 'absolute', top: 28, left: 20,
    borderWidth: 4, borderColor: '#10B981', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8,
    transform: [{ rotate: '-18deg' }],
    backgroundColor: 'rgba(16,185,129,0.18)',
  },
  likeBadgeText: { fontSize: 26, fontWeight: '900', color: '#10B981', letterSpacing: 2 },
  superBadge: {
    position: 'absolute', top: '40%', alignSelf: 'center', left: 0, right: 0,
    alignItems: 'center',
  },
  superBadgeText: { fontSize: 26, fontWeight: '900', color: '#007AFF' },

  // Info scroll
  infoScroll: { flex: 1, backgroundColor: '#fff' },
  infoContent: { paddingHorizontal: 20, paddingTop: 16 },

  typeBadgeRow: { flexDirection: 'row', marginBottom: 12 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1,
  },
  ownerTypeBadge: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  seekerTypeBadge: { backgroundColor: '#F3E8FF', borderColor: '#C4B5FD' },
  typeBadgeText: { fontSize: 12, fontWeight: '700' },

  quickInfo: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  infoItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
  },
  infoText: { color: '#374151', fontSize: 12, fontWeight: '500', marginLeft: 4 },

  bio: { fontSize: 15, color: '#374151', lineHeight: 21, marginBottom: 16 },

  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  lifestyleTag: {
    backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1, borderColor: '#10B981',
  },
  interestTag: {
    backgroundColor: '#FDF2F8', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1, borderColor: '#EC4899',
  },
  tagText: { color: '#374151', fontSize: 12, fontWeight: '500' },

  compatRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  compatRowLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  ratingContainer: { flexDirection: 'row' },
  star: { fontSize: 16, color: '#E5E7EB', marginLeft: 2 },
  activeStar: { color: '#FBBF24' },

  swipeHint: {
    position: 'absolute',
    top: '38%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 24,
  },
  swipeHintText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 2 },
});
