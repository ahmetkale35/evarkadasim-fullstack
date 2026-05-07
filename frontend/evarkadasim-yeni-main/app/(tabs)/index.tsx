import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, User as UserIcon, X, Lock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '@/services/storage';
import { ProfileCard } from '@/components/ProfileCard';
import { CharacterTestPopup } from '@/components/CharacterTestPopup';
import { CharacterTest } from '@/components/CharacterTest';
import { useUsers } from '@/hooks/useUsers';
import { useMatches } from '@/hooks/useMatches';
import { useCharacterTest } from '@/hooks/useCharacterTest';
import { userService } from '@/services/userService';
import { TestResults } from '@/types';

export default function FindRoommatesScreen() {
  const { users, loading, removeUser, refresh } = useUsers();
  const { addMatch } = useMatches();
  const { hasCompletedBasicTest, setBasicTestResults } = useCharacterTest();

  const [currentIndex, setCurrentIndex] = useState(0);
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

  const dismissTestBanner = async () => {
    const uid = await storage.getUserId();
    if (uid) await AsyncStorage.setItem(`test_banner_dismissed_${uid}`, '1');
    setShowTestBanner(false);
  };

  // Backend compatibility skoruna göre sırala (yüksekten düşüğe)
  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => (b.compatibility ?? 0) - (a.compatibility ?? 0)),
    [users]
  );

  const currentUser = sortedUsers[currentIndex];

  const handleTestComplete = (results: TestResults | null) => {
    if (results) {
      setBasicTestResults(results);
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
    setCurrentIndex(prev => Math.min(prev, sortedUsers.length - 1));
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
    setCurrentIndex(prev => Math.min(prev, sortedUsers.length - 1));
    try {
      await userService.swipe(currentUser.id, 'pass');
    } catch {
      // Geçme isteği başarısız — animasyon zaten tamamlandı, kullanıcıya gösterme
    }
  };

  const handleSuperLike = async () => {
    if (!currentUser) return;
    removeUser(currentUser.id);
    setCurrentIndex(prev => Math.min(prev, sortedUsers.length - 1));
    try {
      const result = await userService.swipe(currentUser.id, 'superlike');
      addMatch(currentUser);
      Alert.alert("Süper Beğeni! ⭐", `${currentUser.name} süper beğenildiğine dair bildirim alacak!`);
      if (!result.isMatch) {
        // Karşı taraf henüz beğenmedi; match listesine yeni eşleşme olarak eklendi
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

  if (!currentUser) {
    return (
      <LinearGradient
        colors={['#EC4899', '#8B5CF6']}
        style={styles.emptyContainer}
      >
        <SafeAreaView style={styles.emptyContent}>
          <Text style={styles.emptyTitle}>{"That's everyone for now!"}</Text>
          <Text style={styles.emptySubtitle}>
            Check back later for more roommate profiles, or expand your search settings.
          </Text>
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
          <TouchableOpacity style={styles.menuButton}>
            <Menu size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Find Roommates</Text>
            {hasCompletedBasicTest() && (
              <Text style={styles.testCompletedText}>
                ✨ Karakter profili aktif
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <UserIcon size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={styles.subHeader}>
          <Text style={styles.subtitle}>
            {sortedUsers.length - currentIndex} potential roommates nearby
          </Text>
        </View>

        {showTestBanner && !hasCompletedBasicTest() && (
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

      {/* Karakter testi pop-up */}
      <CharacterTestPopup
        visible={showTestPopup}
        onClose={handleClosePopup}
        onStartTest={handleStartTest}
      />
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
  profileButton: {
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
  subHeader: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
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
  },
});