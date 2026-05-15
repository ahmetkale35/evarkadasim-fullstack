import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, ScrollView, RefreshControl, Animated, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Lock, RotateCcw, Chrome as Home, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '@/services/storage';
import { ProfileCard } from '@/components/ProfileCard';
import { CharacterTestPopup } from '@/components/CharacterTestPopup';
import { CharacterTest } from '@/components/CharacterTest';
import { useUsers } from '@/hooks/useUsers';
import { useMatches } from '@/hooks/useMatches';
import { useCharacterTest } from '@/hooks/useCharacterTest';
import { useProfile } from '@/hooks/useProfile';
import { userService } from '@/services/userService';
import { profileService } from '@/services/profileService';
import { propertyService } from '@/services/propertyService';
import { profileEvents } from '@/services/profileEvents';
import { feedEvents } from '@/services/feedEvents';
import { propertyEvents } from '@/services/propertyEvents';
import { TestResults } from '@/types';

export default function FindRoommatesScreen() {
  const { users, loading, removeUser, refresh } = useUsers();
  const { addMatch } = useMatches();
  const { hasCompletedBasicTest, setBasicTestResults, syncBasicTestFromServer } = useCharacterTest();
  const { profile, refresh: refreshProfile } = useProfile();
  const router = useRouter();
  const [showLookingForModal, setShowLookingForModal] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const lastRefreshAt = useRef(0);
  const REFRESH_COOLDOWN_MS = 15_000;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const handleSelectRoommate = async () => {
    setShowLookingForModal(false);
    if (!profile?.hasProperty) {
      router.push('/property/new');
      return;
    }
    await profileService.updateProfile({ lookingFor: 'Roommate' });
    profileEvents.emitRefreshNeeded();
    feedEvents.emitRefreshNeeded();
    refreshProfile();
    refresh();
  };

  const handleSelectRoom = () => {
    if (profile?.hasProperty) {
      Alert.alert(
        'Ev İlanı Silinecek',
        'Ev arıyorum seçeneğini seçerseniz mevcut ev ilanınız silinecek. Emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Sil ve Devam Et',
            style: 'destructive',
            onPress: async () => {
              try {
                await propertyService.deleteMine();
                await profileService.updateProfile({ lookingFor: 'Room' });
                setShowLookingForModal(false);
                profileEvents.emitRefreshNeeded();
                feedEvents.emitRefreshNeeded();
                propertyEvents.emitRefreshNeeded();
                refreshProfile();
                refresh();
              } catch {
                Alert.alert('Hata', 'İlan silinemedi. Lütfen tekrar dene.');
              }
            },
          },
        ]
      );
    } else {
      setShowLookingForModal(false);
      profileService.updateProfile({ lookingFor: 'Room' }).then(() => {
        profileEvents.emitRefreshNeeded();
        feedEvents.emitRefreshNeeded();
        refreshProfile();
        refresh();
      });
    }
  };

  const handleResetFeed = async () => {
    setResetting(true);
    try {
      const { deletedCount } = await userService.resetFeed();
      setCurrentIndex(0);
      await refresh();
      if (deletedCount > 0) {
        showToast(`${deletedCount} kişi tekrar gösteriliyor`);
      } else {
        showToast('Bölgende şu an yeni üye yok');
      }
    } catch {
      showToast('Bir hata oluştu, tekrar dene');
    } finally {
      setResetting(false);
    }
  };

  const throttledRefresh = () => {
    if (!canRefresh()) {
      const remaining = Math.ceil((REFRESH_COOLDOWN_MS - (Date.now() - lastRefreshAt.current)) / 1000);
      showToast(`${remaining}s sonra yenileyebilirsin`);
      return;
    }
    lastRefreshAt.current = Date.now();
    refresh();
  };

  const canRefresh = () => Date.now() - lastRefreshAt.current > REFRESH_COOLDOWN_MS;


  const [showTestPopup, setShowTestPopup] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [showTestBanner, setShowTestBanner] = useState(false);
  const popupShown = useRef(false);

  useEffect(() => {
    if (!loading && users.length > 0 && !hasCompletedBasicTest() && !popupShown.current) {
      popupShown.current = true;
      setTimeout(() => setShowTestPopup(true), 1000);
    }
  }, [loading]);

  useEffect(() => {
    if (!hasCompletedBasicTest()) {
      storage.getUserId().then(uid => {
        if (!uid) return;
        AsyncStorage.getItem(`test_banner_dismissed_${uid}`).then(val => {
          if (!val) setShowTestBanner(true);
        });
      });
    }
  }, []);

  // Backend'de test sonucu varsa (seed/başka cihaz) local'e sync et — API'ye tekrar göndermez
  useEffect(() => {
    if (profile?.initialBasicTestResults) {
      syncBasicTestFromServer(profile.initialBasicTestResults);
    }
  }, [profile]);

  const dismissTestBanner = async () => {
    const uid = await storage.getUserId();
    if (uid) await AsyncStorage.setItem(`test_banner_dismissed_${uid}`, '1');
    setShowTestBanner(false);
  };

  const currentUser = users[currentIndex];

  const handleTestComplete = async (results: TestResults | null) => {
    if (results) {
      await setBasicTestResults(results);
    }
    setShowTest(false);
    setCurrentIndex(0);
    refresh();
    Alert.alert(
      'Test Tamamlandı! 🎉',
      'Artık sana en uygun ev arkadaşı önerilerini görmeye başlayacaksın.',
      [{ text: 'Harika!', style: 'default' }]
    );
  };

  const handleStartTest = () => {
    setShowTestPopup(false);
    setShowTest(true);
  };

  const handleClosePopup = () => {
    setShowTestPopup(false);
  };

  const handleBackFromTest = () => {
    setShowTest(false);
    setShowTestPopup(true);
  };

  const handleLike = async () => {
    if (!currentUser) return;
    removeUser(currentUser.id);
    setCurrentIndex(prev => Math.max(0, Math.min(prev, users.length - 2)));
    try {
      const result = await userService.swipe(currentUser.id, 'like');
      if (result.isMatch) {
        addMatch(currentUser);
        Alert.alert("Eşleşme! 🏠", `Sen ve ${currentUser.name} birbirinizi beğendiniz!`);
      }
    } catch {
      // Swipe isteği başarısız olursa kart zaten kaldırıldı, sessizce geç
    }
  };

  const handlePass = async () => {
    if (!currentUser) return;
    removeUser(currentUser.id);
    setCurrentIndex(prev => Math.max(0, Math.min(prev, users.length - 2)));
    try {
      await userService.swipe(currentUser.id, 'pass');
    } catch {
      // Geçme isteği başarısız — animasyon zaten tamamlandı, kullanıcıya gösterme
    }
  };

  const handleSuperLike = async () => {
    if (!currentUser) return;
    removeUser(currentUser.id);
    setCurrentIndex(prev => Math.max(0, Math.min(prev, users.length - 2)));
    try {
      const result = await userService.swipe(currentUser.id, 'superlike');
      Alert.alert("Süper Beğeni! ⭐", `${currentUser.name} süper beğenildiğine dair bildirim alacak!`);
      if (result.isMatch) {
        addMatch(currentUser);
      }
    } catch {
      // Süper beğeni başarısız — kullanıcıya gösterme
    }
  };

  // Eğer test gösteriliyorsa test ekranını göster
  if (showTest) {
    return (
      <CharacterTest
        onComplete={handleTestComplete}
        onBack={handleBackFromTest}
      />
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC4899" />
        <Text style={styles.loadingText}>Finding compatible roommates near you...</Text>
      </View>
    );
  }

  const handlePullRefresh = async () => {
    if (!canRefresh()) {
      const remaining = Math.ceil((REFRESH_COOLDOWN_MS - (Date.now() - lastRefreshAt.current)) / 1000);
      setRefreshing(false);
      showToast(`${remaining}s sonra yenileyebilirsin`);
      return;
    }
    lastRefreshAt.current = Date.now();
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (!currentUser) {
    return (
      <LinearGradient
        colors={['#EC4899', '#8B5CF6']}
        style={styles.emptyContainer}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.emptyContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handlePullRefresh}
                tintColor="#fff"
                colors={['#fff']}
              />
            }
          >
            <Text style={styles.emptyTitle}>Herkesle tanıştın! 🎉</Text>
            <Text style={styles.emptySubtitle}>
              Yeni üye gelince burada görünecek. Ya da geçtiklerini tekrar görmek ister misin?
            </Text>
            <TouchableOpacity
              style={[styles.resetButton, resetting && { opacity: 0.6 }]}
              onPress={handleResetFeed}
              disabled={resetting}
            >
              {resetting ? (
                <ActivityIndicator color="#EC4899" size="small" />
              ) : (
                <Text style={styles.resetButtonText}>Başa Dön</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
          <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
            <Text style={styles.toastText}>{toastMsg}</Text>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#FDF2F8', '#F3E8FF']}
      style={styles.container}
    >
      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={throttledRefresh}>
            <RotateCcw size={22} color="#111827" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Find Roommates</Text>
            {hasCompletedBasicTest() && (
              <Text style={styles.testCompletedText}>
                ✨ Karakter profili aktif
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.statusBtn, { backgroundColor: profile?.hasProperty ? '#059669' : '#7C3AED' }]}
            onPress={() => setShowLookingForModal(true)}
          >
            {profile?.hasProperty ? (
              <Home size={22} color="#fff" />
            ) : (
              <Search size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.subHeader}>
          <Text style={styles.subtitle}>
            {users.length - currentIndex} potential roommates nearby
          </Text>
          {profile && (
            <View style={styles.feedInfoRow}>
              <View style={[styles.feedInfoTag, profile.hasProperty ? styles.feedInfoTagOwner : styles.feedInfoTagSeeker]}>
                {profile.hasProperty
                  ? <Home size={13} color="#059669" />
                  : <Search size={13} color="#7C3AED" />}
                <Text style={[styles.feedInfoTagText, { color: profile.hasProperty ? '#059669' : '#7C3AED' }]}>
                  {profile.hasProperty ? 'Ev Sahibiyim' : 'Ev Arıyorum'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {showTestBanner && !hasCompletedBasicTest() && currentUser?.compatibility == null && (
          <View style={styles.testBanner}>
            <Lock size={14} color="#7C3AED" />
            <Text style={styles.testBannerText}>Uyumluluk skorlarını görmek için karakterini test et</Text>
            <TouchableOpacity onPress={() => setShowTest(true)}>
              <Text style={styles.testBannerCta}>Teste Git</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={dismissTestBanner} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.cardContainer}>
          <ProfileCard
            key={currentUser.id}
            user={currentUser}
            compatibility={currentUser.compatibility}
            onSwipeLeft={handlePass}
            onSwipeRight={handleLike}
            onSwipeUp={handleSuperLike}
            onLockPress={() => setShowTestPopup(true)}
          />
        </View>
      </SafeAreaView>

      {/* Ne arıyorsun seçici */}
      <Modal
        visible={showLookingForModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowLookingForModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLookingForModal(false)}
        >
          <View style={styles.lookingForSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Ne Arıyorsunuz?</Text>

            {/* Ev sahibiyim kartı */}
            <TouchableOpacity
              style={[styles.typeCard, profile?.hasProperty && styles.typeCardActiveGreen]}
              onPress={handleSelectRoommate}
            >
              <View style={[styles.typeCardIcon, { backgroundColor: profile?.hasProperty ? '#D1FAE5' : '#ECFDF5' }]}>
                <Home size={22} color="#059669" />
              </View>
              <View style={styles.typeCardText}>
                <Text style={[styles.typeCardTitle, profile?.hasProperty && { color: '#065F46' }]}>Şuan ev sahibiyim</Text>
                <Text style={styles.typeCardSub}>Ev arkadaşı arıyorum</Text>
              </View>
              {profile?.hasProperty && (
                <TouchableOpacity
                  style={styles.inlineEditBtn}
                  onPress={() => { setShowLookingForModal(false); router.push('/property/new'); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.inlineEditBtnText}>Düzenle</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Ev sahibi değilim kartı */}
            <TouchableOpacity
              style={[styles.typeCard, !profile?.hasProperty && styles.typeCardActivePurple]}
              onPress={handleSelectRoom}
            >
              <View style={[styles.typeCardIcon, { backgroundColor: !profile?.hasProperty ? '#EDE9FE' : '#F3E8FF' }]}>
                <Search size={22} color="#7C3AED" />
              </View>
              <View style={styles.typeCardText}>
                <Text style={[styles.typeCardTitle, !profile?.hasProperty && { color: '#4C1D95' }]}>Şuan ev sahibi değilim</Text>
                <Text style={styles.typeCardSub}>Ev veya uygun bir ev arkadaşı arıyorum</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Karakter testi pop-up */}
      <CharacterTestPopup
        visible={showTestPopup}
        onClose={handleClosePopup}
        onStartTest={handleStartTest}
      />

      <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>
    </LinearGradient>
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
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  testCompletedText: {
    fontSize: 12,
    color: '#EC4899',
    fontWeight: '600',
    marginTop: 2,
  },
  subHeader: {
    alignItems: 'center',
    paddingBottom: 12,
    gap: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  feedInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedInfoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  feedInfoTagOwner: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  feedInfoTagSeeker: {
    backgroundColor: '#F3E8FF',
    borderColor: '#C4B5FD',
  },
  feedInfoTagText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptySubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  resetButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
    minWidth: 140,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#EC4899',
    fontSize: 16,
    fontWeight: '700',
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(17,24,39,0.85)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toastText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  statusBtn: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 5, elevation: 4,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  lookingForSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 12,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 4,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 14,
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6',
  },
  typeCardIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  typeCardText: { flex: 1 },
  typeCardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  typeCardSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  typeCardActiveGreen: {
    backgroundColor: '#F0FDF4', borderColor: '#6EE7B7', borderWidth: 1.5,
  },
  typeCardActivePurple: {
    backgroundColor: '#F5F3FF', borderColor: '#C4B5FD', borderWidth: 1.5,
  },
  inlineEditBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: '#059669',
  },
  inlineEditBtnText: { fontSize: 12, fontWeight: '700', color: '#059669' },
});