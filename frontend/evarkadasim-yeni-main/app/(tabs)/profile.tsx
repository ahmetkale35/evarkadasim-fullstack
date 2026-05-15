import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Switch, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Camera, MapPin, Heart, Star, Shield, Bell, Eye, CreditCard as Edit, Shield as Verified, Brain, Lock, CheckCircle2, LogOut, X, Home, Search } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { CharacterTest } from '@/components/CharacterTest';
import { DetailedCharacterTest } from '@/components/DetailedCharacterTest';
import { useCharacterTest, clearCharacterTestStorage } from '@/hooks/useCharacterTest';
import { useProfile } from '@/hooks/useProfile';
import { profileService } from '@/services/profileService';
import { uploadService } from '@/services/uploadService';
import { authService } from '@/services/authService';
import { CityPicker } from '@/components/CityPicker';
import { authEvents } from '@/services/authEvents';
import { feedEvents } from '@/services/feedEvents';
import { profileEvents } from '@/services/profileEvents';
import { useRouter } from 'expo-router';
import { propertyService } from '@/services/propertyService';

export default function ProfileScreen() {
  const { profile, loading, refresh } = useProfile();
  const router = useRouter();

  const [notifications, setNotifications] = useState(true);
  const [showOnline, setShowOnline] = useState(true);

  useEffect(() => {
    if (profile) {
      setNotifications(profile.notificationsEnabled ?? true);
      setShowOnline(profile.isOnlineStatusVisible ?? true);
    }
  }, [profile]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showBasicTest, setShowBasicTest] = useState(false);
  const [showDetailedTest, setShowDetailedTest] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    bio: '',
    occupation: '',
    education: '',
    city: '',
    lookingFor: '' as 'Roommate' | 'Room' | '',
  });

  const handlePickPhoto = async (replaceIndex?: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri iznine ihtiyaç var.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setUploadingPhoto(true);
    try {
      const url = await uploadService.uploadPhoto(uri);
      const current = profile?.photos ?? [];
      const updated = replaceIndex !== undefined && replaceIndex < current.length
        ? current.map((p, i) => (i === replaceIndex ? url : p))
        : [...current, url];
      await profileService.updateProfile({ photos: updated });
      refresh();
    } catch {
      Alert.alert('Hata', 'Fotoğraf yüklenemedi. Lütfen tekrar dene.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleNotificationsChange = async (value: boolean) => {
    setNotifications(value);
    try {
      await profileService.updateProfile({ notificationsEnabled: value });
    } catch {
      setNotifications(!value);
      Alert.alert('Hata', 'Bildirim ayarı kaydedilemedi.');
    }
  };

  const handleShowOnlineChange = async (value: boolean) => {
    setShowOnline(value);
    try {
      await profileService.updateProfile({ isOnlineStatusVisible: value });
    } catch {
      setShowOnline(!value);
      Alert.alert('Hata', 'Çevrimiçi görünme ayarı kaydedilemedi.');
    }
  };

  const openEditModal = () => {
    setEditForm({
      firstName: profile?.name ?? '',
      lastName: profile?.lastName ?? '',
      age: profile?.age ? String(profile.age) : '',
      bio: profile?.bio ?? '',
      occupation: profile?.occupation ?? '',
      education: profile?.education ?? '',
      city: profile?.location?.city ?? '',
      lookingFor: profile?.hasProperty ? 'Roommate' : 'Room',
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    setEditSaving(true);
    try {
      await profileService.updateProfile({
        firstName: editForm.firstName.trim() || undefined,
        lastName: editForm.lastName.trim() || undefined,
        age: editForm.age ? parseInt(editForm.age, 10) : undefined,
        bio: editForm.bio.trim() || undefined,
        occupation: editForm.occupation.trim() || undefined,
        education: editForm.education.trim() || undefined,
        city: editForm.city.trim() || undefined,
        lookingFor: editForm.lookingFor || undefined,
      });
      setShowEditModal(false);
      refresh();
      feedEvents.emitRefreshNeeded();
    } catch {
      Alert.alert('Hata', 'Profil güncellenemedi. Lütfen tekrar dene.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkmak istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap', style: 'destructive', onPress: async () => {
          await clearCharacterTestStorage();
          await authService.logout();
          authEvents.emitUnauthorized();
        }
      },
    ]);
  };

  // Global test hook'unu kullan
  const {
    basicTestResults,
    detailedTestResults,
    setBasicTestResults,
    setDetailedTestResults,
    hasCompletedBasicTest,
    hasCompletedDetailedTest,
    getPersonalityType,
    getPersonalityDescription
  } = useCharacterTest();

  const stats = [
    { label: 'Beğenilen', value: profile?.likedProfilesCount?.toString() ?? '—', icon: Heart },
    { label: 'Eşleşme', value: profile?.matchesCount?.toString() ?? '—', icon: Star },
  ];

  const handleBasicTestComplete = async (results: typeof basicTestResults) => {
    if (results) {
      await setBasicTestResults(results);
      feedEvents.emitRefreshNeeded();
    }
    setShowBasicTest(false);
  };

  const handleDetailedTestComplete = async (results: typeof detailedTestResults) => {
    if (results) {
      await setDetailedTestResults(results);
      feedEvents.emitRefreshNeeded();
    }
    setShowDetailedTest(false);
  };

  const handleBackFromTest = () => {
    setShowBasicTest(false);
    setShowDetailedTest(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF2F8' }}>
        <ActivityIndicator size="large" color="#EC4899" />
      </View>
    );
  }

  if (showBasicTest) {
    return (
      <CharacterTest
        onComplete={handleBasicTestComplete}
        onBack={handleBackFromTest}
      />
    );
  }

  if (showDetailedTest && basicTestResults) {
    return (
      <DetailedCharacterTest
        onComplete={handleDetailedTestComplete}
        onBack={handleBackFromTest}
        basicResults={basicTestResults}
      />
    );
  }

  return (
    <>
    <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#fff' }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={editStyles.header}>
            <Text style={editStyles.title}>Profili Düzenle</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={editStyles.form}>
            <LinearGradient
              colors={['#FDF2F8', '#EDE9FE']}
              style={editStyles.lookingForCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={editStyles.lookingForHeader}>
                <Text style={editStyles.lookingForHeading}>Ne Arıyorsunuz?</Text>
                <Text style={editStyles.lookingForSub}>Profilinizin nasıl görüneceğini belirler</Text>
              </View>
              <View style={editStyles.lookingForBtns}>
                <TouchableOpacity
                  style={[editStyles.typeBtn, editForm.lookingFor === 'Roommate' && editStyles.typeBtnActive]}
                  onPress={() => {
                    if (!profile?.hasProperty) {
                      Alert.alert('İlan Gerekli', 'Ev sahibi olmak için önce bir ilan eklemelisiniz.');
                      return;
                    }
                    setEditForm(f => ({ ...f, lookingFor: 'Roommate' }));
                  }}
                >
                  <Home size={18} color={editForm.lookingFor === 'Roommate' ? '#fff' : '#059669'} />
                  <Text style={[editStyles.typeBtnText, editForm.lookingFor === 'Roommate' && { color: '#fff' }]}>Ev Sahibiyim</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[editStyles.typeBtn, editForm.lookingFor === 'Room' && editStyles.typeBtnRoomActive]}
                  onPress={() => {
                    if (profile?.hasProperty) {
                      Alert.alert(
                        'Ev İlanı Silinecek',
                        'Ev arıyorum seçeneğini seçerseniz mevcut ev ilanınız silinecek. Emin misiniz?',
                        [
                          { text: 'İptal', style: 'cancel' },
                          {
                            text: 'Sil ve Devam Et',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await propertyService.deleteMine();
                                await profileService.updateProfile({ lookingFor: 'Room' });
                                setEditForm(f => ({ ...f, lookingFor: 'Room' }));
                                profileEvents.emitRefreshNeeded();
                                feedEvents.emitRefreshNeeded();
                              } catch {
                                Alert.alert('Hata', 'İlan silinemedi. Lütfen tekrar dene.');
                              }
                            },
                          },
                        ]
                      );
                    } else {
                      setEditForm(f => ({ ...f, lookingFor: 'Room' }));
                    }
                  }}
                >
                  <Search size={18} color={editForm.lookingFor === 'Room' ? '#fff' : '#7C3AED'} />
                  <Text style={[editStyles.typeBtnText, editForm.lookingFor === 'Room' && { color: '#fff' }]}>Ev Arıyorum</Text>
                </TouchableOpacity>
              </View>
              {editForm.lookingFor === 'Roommate' && (
                <TouchableOpacity
                  style={editStyles.propertyEditBtn}
                  onPress={() => { setShowEditModal(false); router.push('/property/new'); }}
                >
                  <Home size={16} color="#EC4899" />
                  <Text style={editStyles.propertyEditBtnText}>
                    {profile?.hasProperty ? 'Ev İlanını Düzenle →' : 'Ev İlanı Oluştur →'}
                  </Text>
                </TouchableOpacity>
              )}
            </LinearGradient>
            {[
              { label: 'Ad', key: 'firstName', placeholder: 'Adınız' },
              { label: 'Soyad', key: 'lastName', placeholder: 'Soyadınız' },
              { label: 'Yaş', key: 'age', placeholder: '25', keyboard: 'numeric' as const },
              { label: 'Meslek', key: 'occupation', placeholder: 'Yazılım Mühendisi' },
              { label: 'Eğitim', key: 'education', placeholder: 'Üniversite' },
              { label: 'Hakkımda', key: 'bio', placeholder: 'Kendinizi tanıtın...', multiline: true },
            ].map(({ label, key, placeholder, keyboard, multiline }) => (
              <View key={key} style={editStyles.field}>
                <Text style={editStyles.label}>{label}</Text>
                <TextInput
                  style={[editStyles.input, multiline && editStyles.inputMultiline]}
                  placeholder={placeholder}
                  placeholderTextColor="#9CA3AF"
                  value={editForm[key as keyof typeof editForm]}
                  onChangeText={v => setEditForm(f => ({ ...f, [key]: v }))}
                  keyboardType={keyboard ?? 'default'}
                  multiline={multiline}
                  numberOfLines={multiline ? 3 : 1}
                />
              </View>
            ))}
            <View style={editStyles.field}>
              <Text style={editStyles.label}>Şehir</Text>
              <CityPicker
                value={editForm.city}
                onChange={v => setEditForm(f => ({ ...f, city: v }))}
              />
            </View>
          </ScrollView>
          <View style={editStyles.footer}>
            <TouchableOpacity
              style={[editStyles.saveBtn, editSaving && { opacity: 0.6 }]}
              onPress={handleSaveProfile}
              disabled={editSaving}
            >
              <LinearGradient colors={['#EC4899', '#8B5CF6']} style={editStyles.saveBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={editStyles.saveBtnText}>{editSaving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>

    <LinearGradient
      colors={['#FDF2F8', '#F3E8FF']}
      style={styles.container}
    >
      <SafeAreaView style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Profil</Text>
            <TouchableOpacity style={styles.settingsButton}>
              <Settings size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Profile Photos */}
          <View style={styles.photosContainer}>
            <View style={styles.mainPhotoContainer}>
              {profile?.photos?.[0] ? (
                <Image source={{ uri: profile.photos[0] }} style={styles.mainPhoto} />
              ) : (
                <View style={[styles.mainPhoto, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
                  <Camera size={40} color="#9CA3AF" />
                </View>
              )}
              <TouchableOpacity
                style={[styles.cameraButton, uploadingPhoto && { opacity: 0.5 }]}
                onPress={() => handlePickPhoto(0)}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? <ActivityIndicator size="small" color="#fff" /> : <Camera size={20} color="#fff" />}
              </TouchableOpacity>
              {profile?.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Verified size={20} color="#fff" fill="#3B82F6" />
                </View>
              )}
            </View>

            <View style={styles.additionalPhotos}>
              {(profile?.photos ?? []).slice(1).map((photo, index) => (
                <View key={index} style={styles.photoSlot}>
                  <Image source={{ uri: photo }} style={styles.additionalPhoto} />
                </View>
              ))}
              <TouchableOpacity
                style={[styles.addPhotoSlot, uploadingPhoto && { opacity: 0.5 }]}
                onPress={() => handlePickPhoto()}
                disabled={uploadingPhoto}
              >
                <Camera size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Info */}
          <View style={styles.infoSection}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile?.name ?? '—'}{profile?.age ? `, ${profile.age}` : ''}</Text>
              <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
                <Edit size={18} color="#EC4899" />
              </TouchableOpacity>
            </View>

            {profile?.location?.city && (
              <View style={styles.locationRow}>
                <MapPin size={16} color="#9CA3AF" />
                <Text style={styles.location}>{profile.location.city}</Text>
              </View>
            )}

            {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

            <View style={styles.detailsContainer}>
              {profile?.occupation && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Meslek</Text>
                  <Text style={styles.detailValue}>{profile.occupation}</Text>
                </View>
              )}
              {profile?.education && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Eğitim</Text>
                  <Text style={styles.detailValue}>{profile.education}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Karakter Testleri */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Karakter Profili</Text>

            {/* Basit Test Sonucu */}
            {basicTestResults && (
              <View style={styles.testResultCard}>
                <View style={styles.testResultHeader}>
                  <Brain size={24} color="#EC4899" />
                  <View style={styles.testResultInfo}>
                    <Text style={styles.testResultTitle}>Temel Kişilik Tipi</Text>
                    <Text style={styles.testResultType}>
                      {getPersonalityType(basicTestResults)} - {getPersonalityDescription(getPersonalityType(basicTestResults))}
                    </Text>
                  </View>
                  <CheckCircle2 size={20} color="#10B981" />
                </View>
              </View>
            )}

            {/* Detaylı Test Sonucu */}
            {detailedTestResults && (
              <View style={styles.testResultCard}>
                <View style={styles.testResultHeader}>
                  <Brain size={24} color="#8B5CF6" />
                  <View style={styles.testResultInfo}>
                    <Text style={styles.testResultTitle}>Detaylı Kişilik Profili</Text>
                    <Text style={styles.testResultType}>
                      {detailedTestResults.personalityType} - Gelişmiş Analiz Tamamlandı
                    </Text>
                  </View>
                  <CheckCircle2 size={20} color="#10B981" />
                </View>
              </View>
            )}

            {/* Test Butonları */}
            <View style={styles.testButtonsContainer}>
              {/* Basit Test Butonu */}
              <TouchableOpacity
                style={[
                  styles.testButton,
                  hasCompletedBasicTest() && styles.testButtonCompleted
                ]}
                onPress={() => setShowBasicTest(true)}
              >
                <LinearGradient
                  colors={hasCompletedBasicTest() ? ['#10B981', '#059669'] : ['#EC4899', '#BE185D']}
                  style={styles.testButtonGradient}
                >
                  <View style={styles.testButtonContent}>
                    <Brain size={24} color="#fff" />
                    <View style={styles.testButtonText}>
                      <Text style={styles.testButtonTitle}>
                        {hasCompletedBasicTest() ? 'Basit Testi Tekrarla' : 'Basit Karakter Testini Çöz'}
                      </Text>
                      <Text style={styles.testButtonSubtitle}>
                        12 soru • 2-3 dakika • Temel profil
                      </Text>
                    </View>
                    {hasCompletedBasicTest() && <CheckCircle2 size={20} color="#fff" />}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Detaylı Test Butonu */}
              <TouchableOpacity
                style={[
                  styles.testButton,
                  !hasCompletedBasicTest() && styles.testButtonLocked,
                  hasCompletedDetailedTest() && styles.testButtonCompleted
                ]}
                onPress={() => hasCompletedBasicTest() && setShowDetailedTest(true)}
                disabled={!hasCompletedBasicTest()}
              >
                <LinearGradient
                  colors={
                    !hasCompletedBasicTest()
                      ? ['#D1D5DB', '#9CA3AF']
                      : hasCompletedDetailedTest()
                        ? ['#10B981', '#059669']
                        : ['#8B5CF6', '#7C3AED']
                  }
                  style={styles.testButtonGradient}
                >
                  <View style={styles.testButtonContent}>
                    {!hasCompletedBasicTest() ? (
                      <Lock size={24} color="#fff" />
                    ) : (
                      <Brain size={24} color="#fff" />
                    )}
                    <View style={styles.testButtonText}>
                      <Text style={styles.testButtonTitle}>
                        {!hasCompletedBasicTest()
                          ? 'Detaylı Test (Kilitli)'
                          : hasCompletedDetailedTest()
                            ? 'Detaylı Testi Tekrarla'
                            : 'Detaylı Karakter Testini Çöz'
                        }
                      </Text>
                      <Text style={styles.testButtonSubtitle}>
                        {!hasCompletedBasicTest()
                          ? 'Önce basit testi tamamlayın'
                          : '36 soru • 6-8 dakika • Hassas profil'
                        }
                      </Text>
                    </View>
                    {hasCompletedDetailedTest() && <CheckCircle2 size={20} color="#fff" />}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Interests */}
          {(profile?.interests ?? []).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>İlgi Alanları</Text>
              <View style={styles.interestsContainer}>
                {profile!.interests.map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İstatistikler</Text>
            <View style={styles.statsContainer}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <stat.icon size={24} color="#EC4899" />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ayarlar</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Bell size={20} color="#6B7280" />
                <Text style={styles.settingLabel}>Bildirimler</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={handleNotificationsChange}
                trackColor={{ false: '#D1D5DB', true: '#FCE7F3' }}
                thumbColor={notifications ? '#EC4899' : '#F3F4F6'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Eye size={20} color="#6B7280" />
                <Text style={styles.settingLabel}>Çevrimiçi görün</Text>
              </View>
              <Switch
                value={showOnline}
                onValueChange={handleShowOnlineChange}
                trackColor={{ false: '#D1D5DB', true: '#FCE7F3' }}
                thumbColor={showOnline ? '#EC4899' : '#F3F4F6'}
              />
            </View>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Yakında', 'Gizlilik & Güvenlik ayarları çok yakında!')}>
              <View style={styles.settingInfo}>
                <Shield size={20} color="#6B7280" />
                <Text style={styles.settingLabel}>Gizlilik & Güvenlik</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem, { marginTop: 8 }]} onPress={handleLogout}>
              <View style={styles.settingInfo}>
                <LogOut size={20} color="#EF4444" />
                <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Çıkış Yap</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
    </>
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
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  settingsButton: {
    padding: 8,
  },
  photosContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  mainPhotoContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 16,
  },
  mainPhoto: {
    width: 200,
    height: 240,
    borderRadius: 20,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  additionalPhotos: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  photoSlot: {
    width: 80,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  additionalPhoto: {
    width: '100%',
    height: '100%',
  },
  addPhotoSlot: {
    width: 80,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  infoSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  editButton: {
    padding: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  location: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 6,
  },
  bio: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
  },
  detailsContainer: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  testResultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#EC4899',
  },
  testResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testResultInfo: {
    flex: 1,
  },
  testResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  testResultType: {
    fontSize: 14,
    color: '#6B7280',
  },
  testButtonsContainer: {
    gap: 12,
  },
  testButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  testButtonCompleted: {
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
  },
  testButtonLocked: {
    shadowOpacity: 0,
    elevation: 0,
  },
  testButtonGradient: {
    padding: 20,
  },
  testButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  testButtonText: {
    flex: 1,
  },
  testButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  testButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  interestText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 32,
  },
});

const editStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  form: {
    padding: 20,
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  saveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  lookingForCard: {
    borderRadius: 18,
    padding: 18,
    gap: 14,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lookingForHeader: {
    gap: 3,
  },
  lookingForHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  lookingForSub: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  lookingForBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  typeBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  typeBtnRoomActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  propertyEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FBCFE8',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  propertyEditBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EC4899',
  },
});