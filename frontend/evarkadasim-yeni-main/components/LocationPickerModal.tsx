import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Dimensions,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, MapPin, Search, Check } from 'lucide-react-native';

const { width: W, height: H } = Dimensions.get('window');

const TURKEY_DEFAULT: Region = {
  latitude: 41.0082, longitude: 28.9784,
  latitudeDelta: 0.05, longitudeDelta: 0.05,
};

interface NominatimResult { display_name: string; lat: string; lon: string; }

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (lat: number, lng: number, displayName: string, city: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export function LocationPickerModal({ visible, onClose, onConfirm, initialLat, initialLng }: Props) {
  const mapRef = useRef<MapView>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [region, setRegion] = useState<Region>({
    latitude: initialLat ?? TURKEY_DEFAULT.latitude,
    longitude: initialLng ?? TURKEY_DEFAULT.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setSuggestions([]);
    if (text.length < 3) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=4&countrycodes=tr`;
        const res = await fetch(url, { headers: { 'User-Agent': 'EvArkadasimApp/1.0' } });
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
      } catch { setSuggestions([]); }
      finally { setSearching(false); }
    }, 400);
  };

  const handleSelectSuggestion = (item: NominatimResult) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setSuggestions([]);
    setSearchQuery(item.display_name);
    const newRegion: Region = { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 500);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const { latitude, longitude } = region;
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'EvArkadasimApp/1.0' } });
      const data = await res.json();
      const displayName: string = data.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      const addr = data.address ?? {};
      const city: string = addr.city ?? addr.province ?? addr.state ?? addr.county ?? '';
      onConfirm(latitude, longitude, displayName, city);
      onClose();
    } catch {
      onConfirm(region.latitude, region.longitude, `${region.latitude.toFixed(5)}, ${region.longitude.toFixed(5)}`, '');
      onClose();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={s.container}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation
          showsMyLocationButton={false}
        />

        {/* Sabit merkez pin */}
        <View style={s.pinContainer} pointerEvents="none">
          <MapPin size={36} color="#EC4899" fill="#EC4899" />
          <View style={s.pinShadow} />
        </View>

        {/* Üst: kapat + arama */}
        <SafeAreaView style={s.topOverlay}>
          <View style={s.topRow}>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <X size={20} color="#111827" />
            </TouchableOpacity>
            <View style={s.searchBox}>
              <Search size={15} color="#9CA3AF" />
              <TextInput
                style={s.searchInput}
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Mahalle veya cadde ara..."
                placeholderTextColor="#9CA3AF"
              />
              {searching && <ActivityIndicator size="small" color="#EC4899" />}
            </View>
          </View>

          {suggestions.length > 0 && (
            <View style={s.suggestionBox}>
              {suggestions.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.suggestionItem, i < suggestions.length - 1 && s.suggestionBorder]}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <MapPin size={12} color="#EC4899" />
                  <Text style={s.suggestionText} numberOfLines={2}>{item.display_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </SafeAreaView>

        {/* Alt: koordinat + onayla */}
        <View style={s.bottomOverlay}>
          <View style={s.coordBadge}>
            <Text style={s.coordText}>
              {region.latitude.toFixed(5)}, {region.longitude.toFixed(5)}
            </Text>
          </View>
          <TouchableOpacity
            style={[s.confirmBtn, confirming && { opacity: 0.7 }]}
            onPress={handleConfirm}
            disabled={confirming}
          >
            {confirming
              ? <ActivityIndicator color="#fff" />
              : <><Check size={20} color="#fff" /><Text style={s.confirmText}>Konumu Onayla</Text></>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  pinContainer: {
    position: 'absolute', top: '50%', left: '50%',
    marginLeft: -18, marginTop: -36,
    alignItems: 'center',
  },
  pinShadow: {
    width: 8, height: 4, borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.2)', marginTop: 2,
  },
  topOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: 12, paddingBottom: 8,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12,
    height: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  suggestionBox: {
    marginTop: 6, backgroundColor: '#fff', borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  suggestionBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  suggestionText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },
  bottomOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 20, paddingBottom: 36,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
    gap: 12,
  },
  coordBadge: {
    backgroundColor: '#F3F4F6', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'center',
  },
  coordText: { fontSize: 13, color: '#6B7280', fontFamily: 'monospace' },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#EC4899', borderRadius: 14, paddingVertical: 15,
  },
  confirmText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
