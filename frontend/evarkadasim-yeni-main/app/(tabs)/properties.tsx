import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chrome as Home, Filter, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { PropertyCard } from '@/components/PropertyCard';
import { useProperties } from '@/hooks/useProperties';
import { Property } from '@/types';

export default function PropertiesScreen() {
  const { properties, loading } = useProperties();
  const router = useRouter();

  const handlePropertyPress = (property: Property) => {
    router.push({ pathname: '/property/[id]', params: { id: property.id } });
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <PropertyCard property={item} onPress={() => handlePropertyPress(item)} />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC4899" />
        <Text style={styles.loadingText}>Loading available properties...</Text>
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
            <Home size={28} color="#EC4899" />
            <Text style={styles.title}>Properties</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Search size={20} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Filter size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.subHeader}>
          <Text style={styles.subtitle}>
            {properties.length} properties available
          </Text>
        </View>

        <FlatList
          data={properties}
          renderItem={renderProperty}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
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
    paddingBottom: 20,
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
});