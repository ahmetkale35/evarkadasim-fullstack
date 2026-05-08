import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, Switch,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, MapPin, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { propertyService, PropertyFormData, PropertyDto } from '@/services/propertyService';
import { profileService } from '@/services/profileService';
import { profileEvents } from '@/services/profileEvents';
import { feedEvents } from '@/services/feedEvents';
import { propertyEvents } from '@/services/propertyEvents';
import { CITY_COORDINATES } from '@/constants/cityCoordinates';
import { LocationPickerModal } from '@/components/LocationPickerModal';

const PROPERTY_TYPES: { label: string; value: PropertyFormData['propertyType'] }[] = [
  { label: 'Daire', value: 'Apartment' },
  { label: 'Stüdyo', value: 'Studio' },
  { label: 'Müstakil', value: 'House' },
  { label: 'Oda', value: 'Room' },
];

const EMPTY_FORM: PropertyFormData = {
  title: '',
  location: '',
  priceAmount: 0,
  currency: '₺',
  pricePeriod: 'ay',
  bedrooms: 1,
  bathrooms: 1,
  propertyType: 'Apartment',
  furnished: false,
  petsAllowed: false,
  smokingAllowed: false,
  description: '',
  availableFrom: new Date().toISOString().split('T')[0],
};

export default function PropertyNewScreen() {
  const router = useRouter();
  const [form, setForm] = useState<PropertyFormData>(EMPTY_FORM);
  const [existingId, setExistingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showPicker, setShowPicker] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<{ display: string; lat: number; lng: number; city: string } | null>(null);
  const [doorNo, setDoorNo] = useState('');

  useEffect(() => {
    propertyService.getMine()
      .then((data: PropertyDto | null) => {
        if (data) {
          setExistingId(data.id);
          if (data.latitude && data.longitude) {
            setSelectedAddress({ display: data.location, lat: data.latitude, lng: data.longitude, city: '' });
          }
          setForm({
            title: data.title,
            location: data.location,
            priceAmount: data.priceAmount,
            currency: data.currency,
            pricePeriod: data.pricePeriod,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            propertyType: data.propertyType,
            furnished: data.furnished,
            petsAllowed: data.petsAllowed,
            smokingAllowed: data.smokingAllowed,
            description: data.description ?? '',
            availableFrom: new Date(data.availableFrom).toISOString().split('T')[0],
            latitude: data.latitude,
            longitude: data.longitude,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleClearAddress = () => { setSelectedAddress(null); setDoorNo(''); };

  const set = (key: keyof PropertyFormData, value: any) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.title.trim()) { Alert.alert('Hata', 'İlan başlığı zorunludur.'); return; }
    if (!selectedAddress) { Alert.alert('Hata', 'Haritadan konum seçilmelidir.'); return; }
    if (form.priceAmount <= 0) { Alert.alert('Hata', 'Kira tutarı girilmelidir.'); return; }

    setSaving(true);
    try {
      const fullDisplay = doorNo.trim()
        ? `${selectedAddress.display} No:${doorNo.trim()}`
        : selectedAddress.display;
      const cityFromAddress = selectedAddress.city || selectedAddress.display.split(',')[0].trim();

      const formToSave: PropertyFormData = {
        ...form,
        location: fullDisplay,
        latitude: selectedAddress.lat,
        longitude: selectedAddress.lng,
      };

      if (existingId) {
        await propertyService.update(existingId, formToSave);
      } else {
        await propertyService.create(formToSave);
      }
      if (cityFromAddress) {
        await profileService.updateProfile({ city: cityFromAddress });
      }
      profileEvents.emitRefreshNeeded();
      feedEvents.emitRefreshNeeded();
      propertyEvents.emitRefreshNeeded();
      router.back();
    } catch {
      Alert.alert('Hata', 'İlan kaydedilemedi. Lütfen tekrar dene.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#fff' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={s.title}>{existingId ? 'İlanı Düzenle' : 'İlan Oluştur'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color="#EC4899" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
            <Field label="İlan Başlığı">
              <TextInput style={s.input} value={form.title} onChangeText={v => set('title', v)}
                placeholder="Beşiktaş'ta 2+1 Daire" placeholderTextColor="#9CA3AF" />
            </Field>

            {/* Konum seçici */}
            <Field label="Konum">
              <TouchableOpacity
                style={[s.locationBtn, selectedAddress && s.locationBtnSelected]}
                onPress={() => setShowPicker(true)}
              >
                <MapPin size={18} color={selectedAddress ? '#059669' : '#EC4899'} />
                <Text style={[s.locationBtnText, selectedAddress && { color: '#059669' }]} numberOfLines={2}>
                  {selectedAddress ? selectedAddress.display : 'Haritadan konum seç...'}
                </Text>
                {selectedAddress && (
                  <TouchableOpacity onPress={handleClearAddress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              {selectedAddress && (
                <TextInput
                  style={[s.input, { marginTop: 8 }]}
                  value={doorNo}
                  onChangeText={setDoorNo}
                  placeholder="Bina / Daire No (opsiyonel)"
                  placeholderTextColor="#9CA3AF"
                />
              )}
            </Field>

            <Field label="Kira (₺/ay)">
              <TextInput
                style={s.input}
                value={form.priceAmount > 0 ? String(form.priceAmount) : ''}
                onChangeText={v => set('priceAmount', parseFloat(v) || 0)}
                keyboardType="numeric"
                placeholder="15000"
                placeholderTextColor="#9CA3AF"
              />
            </Field>

            <Field label="İlan Tipi">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {PROPERTY_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.value}
                    style={[s.chip, form.propertyType === t.value && s.chipActive]}
                    onPress={() => set('propertyType', t.value)}
                  >
                    <Text style={[s.chipText, form.propertyType === t.value && s.chipTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Field>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Oda Sayısı">
                  <TextInput style={s.input} value={String(form.bedrooms)}
                    onChangeText={v => set('bedrooms', parseInt(v) || 0)}
                    keyboardType="numeric" />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Banyo Sayısı">
                  <TextInput style={s.input} value={String(form.bathrooms)}
                    onChangeText={v => set('bathrooms', parseInt(v) || 0)}
                    keyboardType="numeric" />
                </Field>
              </View>
            </View>

            <Field label="Uygunluk Tarihi (YYYY-AA-GG)">
              <TextInput style={s.input} value={form.availableFrom}
                onChangeText={v => set('availableFrom', v)}
                placeholder="2025-06-01" placeholderTextColor="#9CA3AF" />
            </Field>

            <Field label="Açıklama">
              <TextInput style={[s.input, s.inputMultiline]} value={form.description}
                onChangeText={v => set('description', v)}
                placeholder="Ev hakkında bilgi verin..." placeholderTextColor="#9CA3AF"
                multiline numberOfLines={4} textAlignVertical="top" />
            </Field>

            <Field label="Özellikler">
              <ToggleRow label="Eşyalı" value={form.furnished} onChange={v => set('furnished', v)} />
              <ToggleRow label="Evcil hayvan kabul" value={form.petsAllowed} onChange={v => set('petsAllowed', v)} />
              <ToggleRow label="Sigara içilebilir" value={form.smokingAllowed} onChange={v => set('smokingAllowed', v)} />
            </Field>
          </ScrollView>
        )}

        <LocationPickerModal
          visible={showPicker}
          onClose={() => setShowPicker(false)}
          onConfirm={(lat, lng, display, city) => setSelectedAddress({ lat, lng, display, city })}
          initialLat={selectedAddress?.lat}
          initialLng={selectedAddress?.lng}
        />

        <View style={s.footer}>
          <TouchableOpacity
            style={[s.saveBtn, (saving || loading) && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving || loading}
          >
            <LinearGradient colors={['#EC4899', '#8B5CF6']} style={s.saveBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.saveBtnText}>{saving ? 'Kaydediliyor...' : existingId ? 'Güncelle' : 'İlan Oluştur'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={s.toggleRow}>
      <Text style={s.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: '#EC4899' }} />
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  form: { padding: 20, gap: 16, paddingBottom: 32 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: '#111827',
  },
  inputMultiline: { minHeight: 100 },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13,
  },
  locationBtnSelected: { borderColor: '#6EE7B7', backgroundColor: '#F0FDF4' },
  locationBtnText: { flex: 1, fontSize: 14, color: '#9CA3AF', lineHeight: 20 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  chipActive: { backgroundColor: '#EC4899', borderColor: '#EC4899' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#fff' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  toggleLabel: { fontSize: 15, color: '#374151' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  saveBtn: { borderRadius: 14, overflow: 'hidden' },
  saveBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 17, fontWeight: '600', color: '#fff' },
});
