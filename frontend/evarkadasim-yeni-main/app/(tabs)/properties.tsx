import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, X, ChevronRight, User, Home, Lock } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '@/services/storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { usePropertyMapPins } from '@/hooks/usePropertyMapPins';
import { useProfile } from '@/hooks/useProfile';
import { ProfileCard } from '@/components/ProfileCard';
import { CharacterTest, TestResults } from '@/components/CharacterTest';
import { PropertyMapPin, User as UserType } from '@/types';
import { userService } from '@/services/userService';
import { useCharacterTest } from '@/hooks/useCharacterTest';
import { CITY_COORDINATES } from '@/constants/cityCoordinates';

const { height: SCREEN_H } = Dimensions.get('window');

const TURKEY_CENTER = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 2.5,
  longitudeDelta: 2.5,
};

const PROPERTY_TYPE_LABELS: Record<PropertyMapPin['propertyType'], string> = {
  apartment: 'Daire',
  house: 'Müstakil',
  studio: 'Stüdyo',
  shared: 'Oda',
};


// ─────────────────────────────────────────────
export default function ExploreScreen() {
  const { profile, refresh: refreshProfile } = useProfile();
  const userCity = profile?.location?.city;
  const { pins, loading, error } = usePropertyMapPins(userCity);
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);

  // Tab'a her dönüşte profili yenile — şehir değişimi profile.tsx'ten gelir
  useFocusEffect(useCallback(() => { refreshProfile(); }, [refreshProfile]));

  const initialRegion = useMemo(() => TURKEY_CENTER, []);

  const zoomToCity = useCallback((city: string) => {
    const region = CITY_COORDINATES[city];
    if (!region || !mapRef.current) return;
    mapRef.current.animateToRegion(region, 600);
  }, []);

  // Map hazır olduğunda veya city değiştiğinde zoom yap
  useEffect(() => {
    if (!mapReady || !userCity) return;
    zoomToCity(userCity);
  }, [mapReady, userCity, zoomToCity]);

  const [selected, setSelected] = useState<PropertyMapPin | null>(null);
  const [ownerUser, setOwnerUser] = useState<UserType | null>(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerModalVisible, setOwnerModalVisible] = useState(false);
  const [showTestBanner, setShowTestBanner] = useState(false);
  const [testBannerDismissed, setTestBannerDismissed] = useState(false);
  const swipedRef = useRef(false);
  const [swipeKey, setSwipeKey] = useState(0);
  const router = useRouter();
  const { hasCompletedBasicTest, setBasicTestResults } = useCharacterTest();
  const [showTest, setShowTest] = useState(false);

  useEffect(() => {
    storage.getUserId().then(uid => {
      if (!uid) return;
      AsyncStorage.getItem(`test_banner_dismissed_${uid}`).then(val => {
        if (val) setTestBannerDismissed(true);
      });
    });
  }, []);

  const dismissTestBanner = async () => {
    const uid = await storage.getUserId();
    if (uid) await AsyncStorage.setItem(`test_banner_dismissed_${uid}`, '1');
    setTestBannerDismissed(true);
    setShowTestBanner(false);
  };

  const handleTestComplete = (results: TestResults | null) => {
    if (results) setBasicTestResults(results);
    setShowTest(false);
    Alert.alert('Test Tamamlandı! 🎉', 'Artık uyumluluk skorlarını görmeye başlayacaksın.', [{ text: 'Harika!' }]);
  };

  const handleMarkerPress = (pin: PropertyMapPin) => setSelected(pin);

  const handleViewProperty = (id: string) =>
    router.push({ pathname: '/property/[id]', params: { id } });

  const handleViewOwner = async (pin: PropertyMapPin) => {
    setOwnerUser(null);
    swipedRef.current = false;
    setSwipeKey((k) => k + 1);
    setShowTestBanner(!hasCompletedBasicTest() && !testBannerDismissed);
    setOwnerModalVisible(true);
    setOwnerLoading(true);
    const user = await userService.getById(pin.ownerId);
    setOwnerUser(user);
    setOwnerLoading(false);
  };

  const handleSwipe = async (action: 'like' | 'pass') => {
    if (!ownerUser || swipedRef.current) return;
    swipedRef.current = true;
    const swipePromise = userService.swipe(ownerUser.id, action).catch(() => null);
    await new Promise((r) => setTimeout(r, 420));
    setOwnerModalVisible(false);
    const result = await swipePromise;
    if (result?.isMatch) {
      Alert.alert('Eşleşme! 🎉', `${ownerUser.name} ile eşleştin!`, [
        { text: 'Mesaj Gönder', onPress: () => router.push('/(tabs)/messages') },
        { text: 'Tamam' },
      ]);
    }
  };

  const closeModal = () => {
    setOwnerModalVisible(false);
    setOwnerUser(null);
    swipedRef.current = false;
  };

  if (showTest) {
    return <CharacterTest onComplete={handleTestComplete} onBack={() => setShowTest(false)} />;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EC4899" />
        <Text style={styles.loadingText}>Harita yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <MapPin size={48} color="#D1D5DB" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onMapReady={() => setMapReady(true)}
        onPress={() => setSelected(null)}
      >
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            onPress={() => handleMarkerPress(pin)}
            pinColor={selected?.id === pin.id ? '#7C3AED' : '#EC4899'}
          />
        ))}
      </MapView>

      {/* Başlık */}
      <SafeAreaView style={styles.headerWrapper} pointerEvents="box-none">
        <View style={styles.header}>
          <MapPin size={20} color="#EC4899" />
          <Text style={styles.headerTitle}>Keşfet</Text>
          <Text style={styles.headerCount}>{pins.length} ilan</Text>
        </View>
      </SafeAreaView>

      {/* Seçili iğne kartı */}
      {selected && (
        <View style={styles.card}>
          <TouchableOpacity style={styles.cardClose} onPress={() => setSelected(null)}>
            <X size={18} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.cardContent}>
            <View style={styles.cardImagePlaceholder}>
              <MapPin size={32} color="#EC4899" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardType}>{PROPERTY_TYPE_LABELS[selected.propertyType]}</Text>
              <Text style={styles.cardTitle} numberOfLines={2}>{selected.title}</Text>
              <Text style={styles.cardLocation} numberOfLines={1}>{selected.location}</Text>
              <Text style={styles.cardPrice}>{selected.price}</Text>
              {selected.ownerName ? (
                <View style={styles.ownerRow}>
                  <User size={11} color="#9CA3AF" />
                  <Text style={styles.ownerNameText}>{selected.ownerName}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.cardBtn, styles.propertyBtn]}
              onPress={() => handleViewProperty(selected.id)}
            >
              <Home size={15} color="#7C3AED" />
              <Text style={styles.propertyBtnText}>Evi Gör</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cardBtn, styles.ownerBtn]}
              onPress={() => handleViewOwner(selected)}
            >
              <User size={15} color="#fff" />
              <Text style={styles.ownerBtnText}>Sahibini Gör</Text>
              <ChevronRight size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {pins.length === 0 && (
        <View style={styles.emptyOverlay}>
          <MapPin size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>Henüz konumlu ilan yok</Text>
        </View>
      )}

      {/* Sahip profili modal */}
      <Modal
        visible={ownerModalVisible}
        animationType="slide"
        transparent={false}
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaView style={styles.modalRoot}>
            {/* Kapat */}
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={closeModal}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {showTestBanner && !hasCompletedBasicTest() && (
              <View style={styles.testBanner}>
                <Lock size={14} color="#7C3AED" />
                <Text style={styles.testBannerText}>Uyumluluk skorunu görmek için karakterini test et</Text>
                <TouchableOpacity onPress={() => { closeModal(); setShowTest(true); }}>
                  <Text style={styles.testBannerCta}>Teste Git</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={dismissTestBanner} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={14} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            )}

            {ownerLoading ? (
              <View style={styles.modalCenter}>
                <ActivityIndicator size="large" color="#EC4899" />
                <Text style={styles.modalLoadingText}>Profil yükleniyor...</Text>
              </View>
            ) : ownerUser ? (
              <View style={styles.modalCardContainer}>
                <ProfileCard
                  key={swipeKey}
                  user={ownerUser}
                  compatibility={ownerUser.compatibility}
                  onSwipeLeft={() => handleSwipe('pass')}
                  onSwipeRight={() => handleSwipe('like')}
                  onLockPress={() => { closeModal(); setShowTest(true); }}
                />
              </View>
            ) : (
              <View style={styles.modalCenter}>
                <Text style={styles.modalErrorText}>Profil yüklenemedi.</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={closeModal}>
                  <Text style={styles.retryBtnText}>Kapat</Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  testBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#F3E8FF', borderRadius: 12,
    borderWidth: 1, borderColor: '#DDD6FE',
  },
  testBannerText: { flex: 1, fontSize: 12, color: '#4C1D95', fontWeight: '500' },
  testBannerCta: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF2F8', gap: 12 },
  loadingText: { fontSize: 15, color: '#6B7280' },
  errorText: { fontSize: 15, color: '#EF4444', textAlign: 'center', paddingHorizontal: 32 },

  headerWrapper: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827', flex: 1 },
  headerCount: { fontSize: 13, color: '#6B7280' },

  card: {
    position: 'absolute', bottom: 90, left: 16, right: 16,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  cardClose: { position: 'absolute', top: 12, right: 12, zIndex: 1, padding: 4 },
  cardContent: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  cardImagePlaceholder: {
    width: 72, height: 72, borderRadius: 10,
    backgroundColor: '#FDF2F8', alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1, paddingRight: 24 },
  cardType: {
    fontSize: 11, fontWeight: '600', color: '#EC4899',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  cardLocation: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  cardPrice: { fontSize: 14, fontWeight: '700', color: '#7C3AED' },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ownerNameText: { fontSize: 11, color: '#9CA3AF' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  cardBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10,
  },
  propertyBtn: { backgroundColor: '#F3E8FF', borderWidth: 1, borderColor: '#8B5CF6' },
  ownerBtn: { backgroundColor: '#EC4899' },
  propertyBtnText: { color: '#7C3AED', fontSize: 14, fontWeight: '700' },
  ownerBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  emptyOverlay: {
    position: 'absolute', top: SCREEN_H * 0.4, alignSelf: 'center',
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12, padding: 20, gap: 8,
  },
  emptyText: { fontSize: 14, color: '#9CA3AF' },

  // Modal
  modalRoot: { flex: 1, backgroundColor: '#F3E8FF' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalCardContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  modalCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  modalLoadingText: { color: '#EC4899', fontSize: 15, fontWeight: '500' },
  modalErrorText: { color: '#374151', fontSize: 16, fontWeight: '500' },
  retryBtn: { backgroundColor: '#EC4899', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
