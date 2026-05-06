import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MapPin, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react-native';
import { useProperties } from '@/hooks/useProperties';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { properties, loading } = useProperties();
  const router = useRouter();

  const property = properties.find(p => p.id === id);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EC4899" />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>İlan bulunamadı.</Text>
      </View>
    );
  }

  const typeLabel: Record<string, string> = {
    apartment: 'Daire',
    house: 'Müstakil',
    studio: 'Stüdyo',
    shared: 'Oda',
  };

  return (
    <LinearGradient colors={['#FDF2F8', '#F3E8FF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{property.title}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {property.images.length > 0
            ? <Image source={{ uri: property.images[0] }} style={styles.image} />
            : <View style={[styles.image, styles.imagePlaceholder]} />
          }

          <View style={styles.content}>
            <Text style={styles.title}>{property.title}</Text>

            <View style={styles.row}>
              <DollarSign size={16} color="#10B981" />
              <Text style={styles.price}>{property.price}</Text>
            </View>

            <View style={styles.row}>
              <MapPin size={16} color="#6B7280" />
              <Text style={styles.location}>{property.location}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBadge}>
                <Text style={styles.statText}>{property.bedrooms} yatak</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statText}>{property.bathrooms} banyo</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statText}>{typeLabel[property.propertyType] ?? property.propertyType}</Text>
              </View>
              <View style={styles.statBadge}>
                <Calendar size={12} color="#8B5CF6" />
                <Text style={styles.statText}>
                  {new Date(property.availableFrom).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            </View>

            {property.description ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Açıklama</Text>
                <Text style={styles.description}>{property.description}</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Özellikler</Text>
              <View style={styles.featuresRow}>
                <View style={styles.feature}>
                  {property.furnished
                    ? <CheckCircle size={16} color="#10B981" />
                    : <XCircle size={16} color="#EF4444" />}
                  <Text style={styles.featureText}>Eşyalı</Text>
                </View>
                <View style={styles.feature}>
                  {property.petsAllowed
                    ? <CheckCircle size={16} color="#10B981" />
                    : <XCircle size={16} color="#EF4444" />}
                  <Text style={styles.featureText}>Evcil hayvan</Text>
                </View>
                <View style={styles.feature}>
                  {property.smokingAllowed
                    ? <CheckCircle size={16} color="#10B981" />
                    : <XCircle size={16} color="#EF4444" />}
                  <Text style={styles.featureText}>Sigara</Text>
                </View>
              </View>
            </View>

            {property.amenities.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Olanaklar</Text>
                <View style={styles.amenitiesRow}>
                  {property.amenities.map((amenity, i) => (
                    <View key={i} style={styles.amenityTag}>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF2F8' },
  errorText: { fontSize: 16, color: '#6B7280' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: { padding: 8 },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  placeholder: { width: 40 },
  image: { width: '100%', height: 240, resizeMode: 'cover' },
  imagePlaceholder: { backgroundColor: '#E5E7EB' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  price: { fontSize: 18, fontWeight: '700', color: '#10B981', marginLeft: 6 },
  location: { fontSize: 15, color: '#6B7280', marginLeft: 6 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 20 },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  description: { fontSize: 15, color: '#374151', lineHeight: 22 },
  featuresRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featureText: { fontSize: 13, color: '#374151' },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityTag: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  amenityText: { fontSize: 12, color: '#8B5CF6', fontWeight: '500' },
});
