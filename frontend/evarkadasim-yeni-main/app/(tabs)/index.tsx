import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, User as UserIcon } from 'lucide-react-native';
import { ProfileCard } from '@/components/ProfileCard';
import { SwipeableCard } from '@/components/SwipeableCard';
import { CharacterTestPopup } from '@/components/CharacterTestPopup';
import { CharacterTest } from '@/components/CharacterTest';
import { useUsers } from '@/hooks/useUsers';
import { useMatches } from '@/hooks/useMatches';
import { useCharacterTest } from '@/hooks/useCharacterTest';
import { userService } from '@/services/userService';
import { User } from '@/types';

export default function FindRoommatesScreen() {
  const { users, loading, removeUser } = useUsers();
  const { addMatch } = useMatches();
  const {
    basicTestResults,
    hasCompletedBasicTest,
    setBasicTestResults
  } = useCharacterTest();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTestPopup, setShowTestPopup] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [usersWithCompatibility, setUsersWithCompatibility] = useState<(User & { compatibility?: number })[]>([]);
  const popupShown = useRef(false); // Session başına bir kez göster

  useEffect(() => {
    if (!loading && users.length > 0 && !hasCompletedBasicTest() && !popupShown.current) {
      popupShown.current = true;
      setTimeout(() => setShowTestPopup(true), 1000);
    }
  }, [loading]); // sadece loading değişince kontrol et

  // Kullanıcı test sonuçları değiştiğinde uyumluluk hesapla
  useEffect(() => {
    if (basicTestResults && users.length > 0) {
      const usersWithScores = users.map(user => ({
        ...user,
        compatibility: calculateCompatibility(basicTestResults, user)
      }));

      // Uyumluluk skoruna göre sırala (yüksekten düşüğe)
      usersWithScores.sort((a, b) => (b.compatibility || 0) - (a.compatibility || 0));

      setUsersWithCompatibility(usersWithScores);
    } else {
      setUsersWithCompatibility(users);
    }
  }, [basicTestResults, users]);

  const calculateCompatibility = (userResults: typeof basicTestResults, otherUser: User): number => {
    if (!userResults) return 0;

    // Eğer diğer kullanıcının test sonuçları yoksa random bir uyumluluk ver
    if (!otherUser.characterProfile) {
      // Demo için random karakter profili oluştur
      const randomProfile = {
        socialEnergy: Math.random() * 4 + 1,
        orderApproach: Math.random() * 4 + 1,
        conflictManagement: Math.random() * 4 + 1,
        sharingStyle: Math.random() * 4 + 1,
        lifeRhythm: Math.random() * 4 + 1,
        communicationStyle: Math.random() * 4 + 1,
      };
      otherUser.characterProfile = randomProfile;
    }

    // Her boyut için farkı hesapla
    const dimensions = Object.keys(userResults) as (keyof typeof userResults)[];
    let totalDifference = 0;

    dimensions.forEach(dimension => {
      const userScore = userResults[dimension];
      const otherScore = otherUser.characterProfile![dimension];
      const difference = Math.abs(userScore - otherScore);
      totalDifference += difference;
    });

    // Ortalama farkı hesapla (0-4 arası)
    const avgDifference = totalDifference / dimensions.length;

    // Uyumluluk yüzdesine çevir (4-0 fark = %0-100 uyumluluk)
    const compatibility = Math.max(0, ((4 - avgDifference) / 4) * 100);

    return Math.round(compatibility);
  };

  const currentUser = usersWithCompatibility[currentIndex];

  const handleTestComplete = (results: typeof basicTestResults) => {
    if (results) {
      setBasicTestResults(results);
    }
    setShowTest(false);
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
    setCurrentIndex(prev => Math.min(prev, usersWithCompatibility.length - 1));
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
    setCurrentIndex(prev => Math.min(prev, usersWithCompatibility.length - 1));
    try {
      await userService.swipe(currentUser.id, 'pass');
    } catch {
      // Geçme isteği başarısız — animasyon zaten tamamlandı, kullanıcıya gösterme
    }
  };

  const handleSuperLike = async () => {
    if (!currentUser) return;
    removeUser(currentUser.id);
    setCurrentIndex(prev => Math.min(prev, usersWithCompatibility.length - 1));
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
          <Text style={styles.emptyTitle}>That's everyone for now!</Text>
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
            {usersWithCompatibility.length - currentIndex} potential roommates nearby
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <SwipeableCard key={currentUser.id} onSwipeLeft={handlePass} onSwipeRight={handleLike} onSwipeUp={handleSuperLike}>
            <ProfileCard user={currentUser} compatibility={currentUser.compatibility} />
          </SwipeableCard>
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