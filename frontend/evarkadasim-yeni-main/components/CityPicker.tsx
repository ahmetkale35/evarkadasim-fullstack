import React, { useState } from 'react';
import { Modal, View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { TURKISH_CITIES } from '@/constants/cities';

interface Props {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
}

export function CityPicker({ value, onChange, placeholder = 'Şehir seç' }: Props) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = TURKISH_CITIES.filter(c =>
    c.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr'))
  );

  const select = (city: string) => {
    onChange(city);
    setSearch('');
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setVisible(true)}>
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Şehir Seç</Text>
            <TouchableOpacity onPress={() => { setSearch(''); setVisible(false); }}>
              <Text style={styles.close}>İptal</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchWrap}>
            <TextInput
              style={styles.search}
              placeholder="Ara..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => select(item)}>
                <Text style={[styles.itemText, item === value && styles.itemSelected]}>{item}</Text>
                {item === value && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  triggerText: { flex: 1, fontSize: 16, color: '#111827' },
  placeholder: { color: '#9CA3AF' },
  chevron: { fontSize: 20, color: '#9CA3AF' },
  modal: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  close: { fontSize: 16, color: '#EC4899', fontWeight: '600' },
  searchWrap: { padding: 12 },
  search: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  itemText: { flex: 1, fontSize: 16, color: '#374151' },
  itemSelected: { color: '#EC4899', fontWeight: '600' },
  check: { fontSize: 16, color: '#EC4899' },
});
