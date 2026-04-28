import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Bed, Bath, Calendar, Check, X } from 'lucide-react-native';
import { Property } from '@/types';

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
}

export function PropertyCard({ property, onPress }: PropertyCardProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: property.images[0] }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>{property.title}</Text>
          <Text style={styles.price}>{property.price}</Text>
        </View>
        
        <View style={styles.locationRow}>
          <MapPin size={14} color="#9CA3AF" />
          <Text style={styles.location}>{property.location}</Text>
        </View>
        
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Bed size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed`}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Bath size={16} color="#6B7280" />
            <Text style={styles.detailText}>{property.bathrooms} bath</Text>
          </View>
          <View style={styles.detailItem}>
            <Calendar size={16} color="#6B7280" />
            <Text style={styles.detailText}>Available {formatDate(property.availableFrom)}</Text>
          </View>
        </View>
        
        <View style={styles.amenities}>
          {property.amenities.slice(0, 2).map((amenity, index) => (
            <View key={index} style={styles.amenityTag}>
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
          {property.amenities.length > 2 && (
            <Text style={styles.moreAmenities}>+{property.amenities.length - 2} more</Text>
          )}
        </View>
        
        <View style={styles.features}>
          <View style={styles.feature}>
            {property.furnished ? (
              <Check size={14} color="#10B981" />
            ) : (
              <X size={14} color="#EF4444" />
            )}
            <Text style={[styles.featureText, property.furnished ? styles.positive : styles.negative]}>
              {property.furnished ? 'Furnished' : 'Unfurnished'}
            </Text>
          </View>
          <View style={styles.feature}>
            {property.petsAllowed ? (
              <Check size={14} color="#10B981" />
            ) : (
              <X size={14} color="#EF4444" />
            )}
            <Text style={[styles.featureText, property.petsAllowed ? styles.positive : styles.negative]}>
              {property.petsAllowed ? 'Pets OK' : 'No pets'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginRight: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EC4899',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  details: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  amenities: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  amenityTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amenityText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  moreAmenities: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  features: {
    flexDirection: 'row',
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
  },
});