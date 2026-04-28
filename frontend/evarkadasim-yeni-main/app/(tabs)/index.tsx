import React, { useState, useEffect } from 'react';
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

  // Kullanıcı giriş yaptıktan sonra pop-up'ı göster (sadece test çözülmemişse)
  useEffect(() => {
    if (!loading && users.length > 0) {
      // Eğer test çözülmemişse pop-up'ı göster
      if (!hasCompletedBasicTest()) {
        setTimeout(() => {
          setShowTestPopup(true);
        }, 1000); // 1 saniye bekle
      }
    }
  }, [loading, users, hasCompletedBasicTest]);

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

  const handleLike = () => {
    if (!currentUser) return;

    // Simulate match probability (30% chance)
    const isMatch = Math.random() > 0.7;

    if (isMatch) {
      addMatch(currentUser);
      Alert.alert(
        "It's a Match! 🏠",
        `You and ${currentUser.name} liked each other!`,
        [{ text: 'Keep Swiping', style: 'default' }]
      );
    }

    removeUser(currentUser.id);
    setCurrentIndex(prev => Math.min(prev, usersWithCompatibility.length - 1));
  };

  const handlePass = () => {
    if (!currentUser) return;
    removeUser(currentUser.id);
    setCurrentIndex(prev => Math.min(prev, usersWithCompatibility.length - 1));
  };

  const handleSuperLike = () => {
    if (!currentUser) return;

    // Super like always creates a match for demo
    addMatch(currentUser);
    Alert.alert(
      "Super Like! ⭐",
      `${currentUser.name} will be notified that you super liked them!`,
      [{ text: 'Amazing!', style: 'default' }]
    );

    removeUser(currentUser.id);
    setCurrentIndex(prev => Math.min(prev, usersWithCompatibility.length - 1));
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