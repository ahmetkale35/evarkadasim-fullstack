# EvArkadaşım - Ev Arkadaşı Bulma Uygulaması

## 📱 Uygulama Hakkında

**EvArkadaşım**, ideal ev arkadaşını bulmanızı sağlayan modern bir React Native uygulamasıdır. Uygulama, kişilik uyumluluğu testleri, akıllı eşleştirme algoritmaları ve sosyal özelliklerle donatılmıştır.

### 🎯 Temel İşlevler
- **Kişilik Testi**: 12 soruluk bilimsel karakter analizi
- **Akıllı Eşleştirme**: Uyumluluk skoruna göre profil önerileri
- **Swipe Sistemi**: Tinder tarzı beğeni/geçme sistemi
- **Mesajlaşma**: Eşleşen kişilerle güvenli iletişim
- **Mülk Arama**: Kiralık ev/oda ilanları
- **Profil Yönetimi**: Kişisel bilgi ve tercih düzenleme

---

## 🏗️ Proje Yapısı

```
evarkadasim-yeni/
├── app/                          # Ana uygulama sayfaları
│   ├── _layout.tsx              # Kök layout ve auth yönetimi
│   ├── +not-found.tsx           # 404 sayfası
│   └── (tabs)/                  # Tab navigasyon sayfaları
│       ├── _layout.tsx          # Tab bar yapılandırması
│       ├── index.tsx            # Ana sayfa (Ev arkadaşı bulma)
│       ├── properties.tsx       # Mülk arama sayfası
│       ├── matches.tsx          # Eşleşmeler sayfası
│       ├── messages.tsx         # Mesajlaşma sayfası
│       └── profile.tsx          # Profil yönetimi sayfası
│
├── components/                   # Yeniden kullanılabilir bileşenler
│   ├── AuthScreen.tsx           # Giriş/Kayıt ekranı
│   ├── LoadingScreen.tsx        # Başlangıç yükleme ekranı
│   ├── ProfileCard.tsx          # Kullanıcı profil kartı
│   ├── SwipeableCard.tsx        # Kaydırılabilir kart bileşeni
│   ├── CharacterTest.tsx        # Kişilik testi bileşeni
│   ├── CharacterTestPopup.tsx   # Test açılır penceresi
│   ├── DetailedCharacterTest.tsx # Detaylı karakter testi
│   ├── ChatMessage.tsx          # Mesaj balonu bileşeni
│   ├── MatchCard.tsx            # Eşleşme kartı
│   └── PropertyCard.tsx         # Mülk kartı
│
├── hooks/                        # Custom React hooks
│   ├── useUsers.ts              # Kullanıcı verisi yönetimi
│   ├── useMatches.ts            # Eşleşme verisi yönetimi
│   ├── useProperties.ts         # Mülk verisi yönetimi
│   ├── useCharacterTest.ts      # Karakter testi state yönetimi
│   └── useFrameworkReady.ts     # Framework hazırlık durumu
│
├── types/                        # TypeScript tip tanımları
│   └── index.ts                 # Tüm interface'ler
│
├── assets/                       # Statik dosyalar
│   └── images/                  # Uygulama ikonları
│
├── package.json                  # NPM bağımlılıkları
├── app.json                     # Expo konfigürasyonu
├── tsconfig.json                # TypeScript ayarları
└── expo-env.d.ts               # Expo tip tanımları
```

---

## 📄 Sayfa Detayları

### 🔐 Giriş Sistemi (`app/_layout.tsx`)

**Konumu**: `app/_layout.tsx`
**İşlevi**: Uygulamanın ana giriş noktası ve auth kontrol merkezi

#### Akış Sırası:
1. **Loading Screen** → `LoadingScreen.tsx` (3.5 saniye)
2. **Auth Check** → Kullanıcı giriş yapmış mı kontrol
3. **Auth Screen** → `AuthScreen.tsx` (giriş yapmamışsa)
4. **Main App** → Tab navigasyon (giriş yapmışsa)

#### Değiştirilecek Yerler:
- **Giriş kontrolü**: `isAuthenticated` state'ini değiştir
- **Loading süresi**: `setTimeout` değerini ayarla
- **Auth mantığı**: `handleAuthSuccess` fonksiyonunu düzenle

---

### 🏠 Ana Sayfa - Ev Arkadaşı Bulma (`app/(tabs)/index.tsx`)

**Konumu**: `app/(tabs)/index.tsx`
**Ana İşlev**: Kullanıcıları keşfetme ve eşleştirme

#### 🔧 Temel Özellikler:

1. **Kişilik Testi Popup**
   - İlk giriş yapıldığında 1 saniye sonra görünür
   - `CharacterTestPopup.tsx` bileşeni kullanılır
   - Test tamamlanmadıysa tekrar görünür

2. **Uyumluluk Hesaplama**
   ```typescript
   // Her boyut için fark hesaplama
   const avgDifference = totalDifference / dimensions.length;
   const compatibility = ((4 - avgDifference) / 4) * 100;
   ```

3. **Swipe İşlemleri**
   - **Sağa**: Beğeni (%30 eşleşme şansı)
   - **Sola**: Geçme
   - **Yukarı**: Süper beğeni (%100 eşleşme)

#### 🎯 Değiştirilecek Dosyalar:

- **Eşleşme algoritması**: `calculateCompatibility` fonksiyonu
- **Popup gösterimi**: `useEffect` içindeki timeout
- **Kullanıcı verisi**: `hooks/useUsers.ts`
- **Test sonuçları**: `hooks/useCharacterTest.ts`

#### 📊 Uyumluluk Sistemı:
- **%90-100**: Mükemmel Uyum (Yeşil)
- **%75-89**: Çok Uyumlu (Amber)  
- **%60-74**: Uyumlu (Pink)
- **%0-59**: Orta Uyum (Kırmızı)

---

### 🏡 Mülk Arama Sayfası (`app/(tabs)/properties.tsx`)

**Konumu**: `app/(tabs)/properties.tsx`
**Ana İşlev**: Kiralık ev/oda ilanlarını görüntüleme

#### 🔧 Özellikler:
- FlatList ile mülk listesi
- `PropertyCard.tsx` bileşeni kullanımı
- Arama ve filtreleme butonları (henüz aktif değil)

#### 📝 Mülk Bilgileri:
- Başlık, fiyat, konum
- Yatak odası/banyo sayısı
- Müsaitlik tarihi
- Özellikler (furnished, pets, smoking)

#### 🛠️ Geliştirme Noktaları:
- **Filtreleme sistemi**: `headerActions` butonlarına işlev ekle
- **Detay sayfası**: `handlePropertyPress` fonksiyonunu geliştir
- **Veri kaynağı**: `hooks/useProperties.ts` dosyasını genişlet

---

### 💕 Eşleşmeler Sayfası (`app/(tabs)/matches.tsx`)

**Konumu**: `app/(tabs)/matches.tsx`
**Ana İşlev**: Mutual beğeni sonucu oluşan eşleşmeleri gösterme

#### 🔧 Özellikler:
- Eşleşme listesi görüntüleme
- `MatchCard.tsx` bileşeni kullanımı
- Boş durum yönetimi (eşleşme yoksa)

#### 📱 Eşleşme Kartı İçeriği:
- Kullanıcı fotoğrafı ve adı
- Son mesaj önizlemesi
- Eşleşme tarihi
- Yeni eşleşme badge'i

#### 🔄 Veri Akışı:
1. Ana sayfada beğeni → `useMatches.addMatch()`
2. Eşleşme oluşturulur → Global state güncellenir
3. Eşleşmeler sayfasında görüntülenir

---

### 💬 Mesajlaşma Sayfası (`app/(tabs)/messages.tsx`)

**Konumu**: `app/(tabs)/messages.tsx`
**Ana İşlev**: Eşleşen kişilerle sohbet etme

#### 📱 İki Mod:
1. **Liste Modu**: Tüm konuşmaları göster
2. **Sohbet Modu**: Seçilen kişiyle mesajlaşma

#### 🔧 Sohbet Özellikleri:
- Gerçek zamanlı mesaj gönderme
- `ChatMessage.tsx` bileşeni kullanımı
- Klavye adaptasyonu
- Mesaj karakteri limiti (500)

#### 📊 Mesaj Türleri:
- **text**: Normal metin mesajı
- **image**: Resim mesajı (henüz aktif değil)
- **gif**: GIF mesajı (henüz aktif değil)

#### 🛠️ Geliştirme Alanları:
- Mesaj geçmişi persistency
- Resim/dosya paylaşımı
- Push notification
- Online durumu gösterimi

---

### 👤 Profil Sayfası (`app/(tabs)/profile.tsx`)

**Konumu**: `app/(tabs)/profile.tsx`
**Ana İşlev**: Kullanıcı profili yönetimi ve ayarlar

#### 📊 Profil İstatistikleri:
- Beğenilen profil sayısı
- Eşleşme sayısı  
- Profil görüntüleme sayısı

#### 🧠 Kişilik Testleri:
- **Temel Test**: 12 soru, 6 boyut
- **Detaylı Test**: Boyut başına 6 ek soru (geliştirme aşamasında)

#### ⚙️ Ayar Seçenekleri:
- Bildirim açma/kapama
- Online durumu görünürlüğü
- Kişilik testi yönetimi

#### 🔄 Test Sistemi:
```typescript
// Test sonuçları global state'te saklanır
const { basicTestResults, hasCompletedBasicTest } = useCharacterTest();
```

---

## 🧩 Component Detayları

### 🎴 ProfileCard (`components/ProfileCard.tsx`)

**İşlevi**: Kullanıcı profillerini kart formatında gösterme

#### 🎨 Görsel Özellikler:
- Kullanıcı fotoğrafı
- Gradient overlay
- Uyumluluk badge'i (sağ üst)
- Kaydırılabilir içerik

#### 📋 İçerik Bölümleri:
1. **Header**: İsim, yaş, doğrulama badge'i
2. **Konum**: Şehir ve mesafe
3. **Hızlı Bilgi**: Bütçe, taşınma tarihi, oda türü
4. **Bio**: Kişisel açıklama
5. **Yaşam Tarzı**: Tag'ler halinde
6. **İlgi Alanları**: Renkli tag'ler
7. **Temizlik/Sosyallik**: Progress bar'lar

#### 🎯 Uyumluluk Badge'i:
```typescript
// Skor bazlı renk sistemı
const getCompatibilityColor = (score) => {
  if (score >= 90) return '#10B981'; // Yeşil
  if (score >= 75) return '#F59E0B'; // Amber
  if (score >= 60) return '#EC4899'; // Pink
  return '#EF4444'; // Kırmızı
};
```

---

### 📱 SwipeableCard (`components/SwipeableCard.tsx`)

**İşlevi**: Kart kaydırma işlevselliği sağlama

#### 🎮 Kontroller:
- **Sağa kaydırma**: onSwipeRight (beğeni)
- **Sola kaydırma**: onSwipeLeft (geçme)  
- **Yukarı kaydırma**: onSwipeUp (süper beğeni)

#### ⚙️ Teknik Detaylar:
```typescript
const SWIPE_THRESHOLD = screenWidth * 0.3; // Kaydırma eşiği
// Gesture hesaplaması
const distance = Math.sqrt(translationX² + translationY²);
```

#### 🎨 Animasyonlar:
- Kaydırma sırasında ölçek küçültme
- Spring animasyonu ile geri dönüş
- Velocity bazlı hızlandırılmış kaydırma

---

### 🧠 CharacterTest (`components/CharacterTest.tsx`)

**İşlevi**: 12 soruluk kişilik değerlendirmesi

#### 📊 Test Boyutları:
1. **Sosyal Enerji** (socialEnergy): İS1, İS2(ters)
2. **Düzen Yaklaşımı** (orderApproach): İS3, İS4(ters)
3. **Çatışma Yönetimi** (conflictManagement): İS5, İS6(ters)
4. **Paylaşım Tarzı** (sharingStyle): İS7, İS8(ters)
5. **Yaşam Ritmi** (lifeRhythm): İS9, İS10(ters)
6. **İletişim Stili** (communicationStyle): İS11, İS12(ters)

#### 🔢 Puanlama Sistemi:
- 1: Kesinlikle Katılmıyorum
- 2: Katılmıyorum  
- 3: Kararsızım
- 4: Katılıyorum
- 5: Kesinlikle Katılıyorum

#### 🔄 Ters Kodlama:
```typescript
// Ters sorular için puan çevirme
const finalScore = isReverse ? (6 - selectedOption) : selectedOption;
```

---

### 🔐 AuthScreen (`components/AuthScreen.tsx`)

**İşlevi**: Kullanıcı giriş ve kayıt işlemleri

#### 🎨 Tasarım Özellikleri:
- Gradient arka plan
- Animasyonlu form girişi
- Logo ve marka öğeleri
- Keyboard adaptasyonu

#### 🔑 Test Giriş Bilgileri:
- **Kullanıcı Adı**: 123
- **Şifre**: 123

#### 🛠️ Geliştirme Alanları:
- Gerçek API entegrasyonu
- E-posta doğrulama
- Şifremi unuttum özelliği
- Social login (Google, Facebook)

---

### ⏳ LoadingScreen (`components/LoadingScreen.tsx`)

**İşlevi**: Uygulama başlangıç animasyonu

#### 🎬 Animasyon Sırası:
1. Heart ikonu (200ms gecikmeli)
2. Home ikonu (500ms gecikmeli)  
3. Users ikonu (800ms gecikmeli)
4. Sparkles dönen animasyon
5. Metin fade-in (1000ms)
6. Progress bar (1200ms)

#### ⏱️ Süre Ayarları:
- Toplam süre: 3.5 saniye
- Fade-out: 500ms
- Otomatik yönlendirme

---

## 🔗 Hook Sistemı

### 👥 useUsers (`hooks/useUsers.ts`)

**İşlevi**: Kullanıcı verilerini yönetme

#### 📊 Veri Yapısı:
```typescript
interface User {
  id: string;
  name: string;
  age: number;
  bio: string;
  photos: string[];
  location: { city: string; distance?: number };
  characterProfile?: TestResults;
  // ... diğer alanlar
}
```

#### 🔧 Fonksiyonlar:
- `users`: Kullanıcı listesi
- `loading`: Yükleme durumu
- `removeUser(id)`: Kullanıcıyı listeden çıkarma

#### 🎯 Kullanım Alanları:
- Ana sayfa profil listesi
- Uyumluluk hesaplaması
- Swipe işlemleri

---

### 💕 useMatches (`hooks/useMatches.ts`)

**İşlevi**: Eşleşme verilerini yönetme

#### 📊 Veri Yapısı:
```typescript
interface Match {
  id: string;
  user: User;
  matchedAt: Date;
  lastMessage?: Message;
  isNewMatch: boolean;
}
```

#### 🔧 Fonksiyonlar:
- `matches`: Eşleşme listesi
- `addMatch(user)`: Yeni eşleşme ekleme
- `loading`: Yükleme durumu

#### 🔄 State Yönetimi:
- Global state pattern
- Automatic re-render tetikleme
- Listener-based güncellemeler

---

### 🧠 useCharacterTest (`hooks/useCharacterTest.ts`)

**İşlevi**: Kişilik testi durumunu global olarak yönetme

#### 🗃️ Global State:
```typescript
let globalBasicTestResults: TestResults | null = null;
let globalDetailedTestResults: DetailedTestResults | null = null;
let listeners: Set<() => void> = new Set();
```

#### 📋 Fonksiyonlar:
- `hasCompletedBasicTest()`: Test tamamlandı mı?
- `setBasicTestResults()`: Test sonuçlarını kaydet
- `getPersonalityType()`: Kişilik tipi hesapla
- `getPersonalityDescription()`: Açıklama metni

#### 🎯 Kişilik Tipleri:
- **E/I**: Extrovert/Introvert (Sosyal Enerji > 3)
- **S/F**: Structured/Flexible (Düzen Yaklaşımı > 3)  
- **D/H**: Direct/Harmonious (Çatışma Yönetimi > 3)

---

### 🏡 useProperties (`hooks/useProperties.ts`)

**İşlevi**: Mülk ilanlarını yönetme

#### 📊 Veri Yapısı:
```typescript
interface Property {
  id: string;
  title: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  amenities: string[];
  // ... diğer alanlar
}
```

#### 🔧 Özellikler:
- Örnek mülk verisi
- Loading state yönetimi
- Filtreleme hazırlığı

---

## 🎨 Stil Sistemi

### 🌈 Renk Paleti

```scss
// Ana Renkler
$primary: #EC4899;      // Pink (Ana renk)
$secondary: #8B5CF6;    // Purple  
$tertiary: #3B82F6;     // Blue

// Gradient Renkler
$gradient-1: #FDF2F8;   // Light pink
$gradient-2: #F3E8FF;   // Light purple
$gradient-3: #EBF4FF;   // Light blue

// Durum Renkleri
$success: #10B981;      // Green
$warning: #F59E0B;      // Amber
$error: #EF4444;        // Red

// Nötr Renkler
$gray-50: #F9FAFB;
$gray-100: #F3F4F6;
$gray-300: #D1D5DB;
$gray-600: #6B7280;
$gray-900: #111827;
```

### 📱 Component Stil Patterns

#### Kart Tasarımı:
```typescript
cardStyle: {
  backgroundColor: '#fff',
  borderRadius: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4, // Android
}
```

#### Buton Tasarımı:
```typescript
buttonStyle: {
  borderRadius: 25,
  paddingVertical: 16,
  paddingHorizontal: 32,
  alignItems: 'center',
  justifyContent: 'center',
}
```

#### Typography:
```typescript
// Başlık stilleri
title: { fontSize: 32, fontWeight: '700' }
subtitle: { fontSize: 18, fontWeight: '600' }
body: { fontSize: 16, fontWeight: '400' }
caption: { fontSize: 14, fontWeight: '500' }
```

---

## 🔄 Veri Akışı

### 1. Uygulama Başlatma
```
App Start → LoadingScreen → AuthScreen → TabNavigation
```

### 2. Profil Keşfi
```
useUsers.ts → index.tsx → ProfileCard → SwipeableCard
```

### 3. Eşleşme Süreci
```
Swipe Right → Math.random() > 0.7 → addMatch() → Eşleşme Bildirimi
```

### 4. Kişilik Testi
```
CharacterTestPopup → CharacterTest → useCharacterTest → Global State
```

### 5. Uyumluluk Hesaplama
```
User Test Results + Other User Profile → calculateCompatibility() → Compatibility Score
```

---

## 🛠️ Değişiklik Rehberi

### 🎯 Eşleşme Oranını Değiştirmek
**Dosya**: `app/(tabs)/index.tsx`
**Satır**: ~130
```typescript
// Şu anki: %30 eşleşme şansı
const isMatch = Math.random() > 0.7;

// Değiştirmek için:
const isMatch = Math.random() > 0.5; // %50 şans
```

### ⏰ Test Popup Süresini Ayarlamak  
**Dosya**: `app/(tabs)/index.tsx`
**Satır**: ~37
```typescript
// Şu anki: 1 saniye bekle
setTimeout(() => setShowTestPopup(true), 1000);

// Değiştirmek için:
setTimeout(() => setShowTestPopup(true), 3000); // 3 saniye
```

### 📊 Uyumluluk Eşiklerini Değiştirmek
**Dosya**: `components/ProfileCard.tsx`
**Satır**: ~18-25
```typescript
// Mevcut eşikler
if (score >= 90) return '#10B981'; // Mükemmel
if (score >= 75) return '#F59E0B'; // Çok uyumlu  
if (score >= 60) return '#EC4899'; // Uyumlu

// Daha sıkı eşikler için:
if (score >= 95) return '#10B981';
if (score >= 85) return '#F59E0B';
if (score >= 70) return '#EC4899';
```

### 🎨 Ana Renkleri Değiştirmek
**Tüm dosyalarda aranacak renkler**:
- `#EC4899` (Ana pink)
- `#8B5CF6` (Purple)  
- `#3B82F6` (Blue)

### 📝 Test Sorularını Değiştirmek
**Dosya**: `components/CharacterTest.tsx`
**Satır**: ~30-100
```typescript
const questions: Question[] = [
  {
    id: 'IS1',
    text: 'YENİ SORU METNİ',
    category: 'socialEnergy',
    isReverse: false,
    // ...
  }
]
```

### 🏠 Örnek Mülk Verilerini Güncelleme
**Dosya**: `hooks/useProperties.ts`
**Satır**: ~5-60
- Yeni mülk objeleri ekle
- Mevcut mülk bilgilerini düzenle
- Resim URL'lerini değiştir

### 👤 Örnek Kullanıcı Verilerini Güncelleme  
**Dosya**: `hooks/useUsers.ts`
**Satır**: ~5-200
- Yeni kullanıcı profilleri ekle
- Karakteristik özelliklerini düzenle
- Profil fotoğraflarını güncelle

---

## 🚀 Geliştirme Komutları

### 📦 Kurulum
```bash
npm install
# veya
yarn install
```

### 🔧 Çalıştırma
```bash
npm run dev
# veya  
yarn dev
```

### 🌐 Web Build
```bash
npm run build:web
# veya
yarn build:web
```

### 🔍 Lint
```bash
npm run lint
# veya
yarn lint
```

---

## 📚 Bağımlılıklar

### 🎯 Ana Framework
- **React Native**: 0.79.1
- **Expo**: ~53.0.0
- **TypeScript**: ~5.8.3

### 🧭 Navigasyon
- **expo-router**: ~5.0.2
- **@react-navigation/native**: ^7.0.14
- **@react-navigation/bottom-tabs**: ^7.2.0

### 🎨 UI/UX
- **expo-linear-gradient**: ~14.1.3
- **react-native-reanimated**: ~3.17.4
- **react-native-gesture-handler**: ~2.24.0
- **lucide-react-native**: ^0.475.0

### 📱 Platform
- **expo-camera**: ~16.1.5
- **expo-blur**: ~14.1.3
- **expo-haptics**: ~14.1.3

---

## 🔮 Gelecek Geliştirmeler

### 🎯 Kısa Vadeli
- [ ] Detaylı karakter testinin tamamlanması
- [ ] Resim/dosya paylaşımı mesajlarda
- [ ] Mülk detay sayfası
- [ ] Gelişmiş filtreleme sistemi

### 🚀 Orta Vadeli  
- [ ] Gerçek API entegrasyonu
- [ ] Push notification sistemi
- [ ] Profil düzenleme ekranı
- [ ] Video profil tanıtımları

### 🌟 Uzun Vadeli
- [ ] Makine öğrenmesi tabanlı eşleştirme
- [ ] Sosyal medya entegrasyonu  
- [ ] Gerçek zamanlı konum paylaşımı
- [ ] Sesli/görüntülü arama özelliği

---

## 🤝 Katkıda Bulunma

Bu uygulama modüler yapıda tasarlanmıştır. Her component ve hook bağımsız olarak geliştirilebilir:

### 📁 Yeni Component Ekleme
1. `components/` klasöründe yeni dosya oluştur
2. TypeScript interface'lerini `types/index.ts`'e ekle  
3. Gerekirse custom hook oluştur
4. Ana sayfalarda import et

### 🔧 Yeni Hook Ekleme
1. `hooks/` klasöründe yeni dosya oluştur
2. useState/useEffect kullanarak state yönet
3. Global state gerekirse listener pattern kullan
4. Component'lerde import et

### 🎨 Stil Güncellemeleri
1. Tutarlı renk paleti kullan
2. Component-specific stiller component dosyasında
3. Global stiller için constants oluştur
4. Responsive tasarım prensiplerini takip et

---

## 📞 Destek

Bu README dosyası uygulamanın tüm detaylarını kapsamaktadır. Herhangi bir sorunla karşılaştığınızda:

1. İlgili dosyayı bu dökümanda bulun
2. Değiştirilmesi gereken kısmı tespit edin  
3. Örnek kod blokları ile karşılaştırın
4. Adım adım değişiklikleri uygulayın

**Not**: Bu uygulama demo amaçlı örnek verilerle çalışmaktadır. Production'da gerçek API entegrasyonu gereklidir.
