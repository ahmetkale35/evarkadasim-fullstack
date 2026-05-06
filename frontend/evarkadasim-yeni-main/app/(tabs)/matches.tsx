import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MatchCard } from '@/components/MatchCard';
import { useMatches } from '@/hooks/useMatches';
import { Match } from '@/types';

export default function MatchesScreen() {
  const { matches, loading } = useMatches();
  const router = useRouter();

  const handleMatchPress = (match: Match) => {
    router.push({ pathname: '/(tabs)/messages', params: { matchId: match.id } });
  };

  const renderMatch = ({ item }: { item: Match }) => (
    <MatchCard match={item} onPress={() => handleMatchPress(item)} />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC4899" />
        <Text style={styles.loadingText}>Loading your matches...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#FDF2F8', '#F3E8FF']}
      style={styles.container}
    >
      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Heart size={28} color="#EC4899" fill="#EC4899" />
            <Text style={styles.title}>Roommate Matches</Text>
          </View>
          <Text style={styles.subtitle}>
            {matches.length} {matches.length === 1 ? 'match' : 'matches'}
          </Text>
        </View>

        {matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Heart size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No roommate matches yet</Text>
            <Text style={styles.emptySubtitle}>
              Keep swiping to find your perfect roommate!
            </Text>
          </View>
        ) : (
          <FlatList
            data={matches}
            renderItem={renderMatch}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
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
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
});