# EvArkadasimV2 — Backend Tamamlama Yol Haritası

API-first yaklaşımı: tüm endpoint'leri tamamla → Postman'le doğrula → en sonda frontend'i bağla.
Frontend mock data ile çalışıyor (`frontend/evarkadasim-yeni-main/`); kontrat olarak `types/index.ts` referans alınacak.

---

## DURUM ÖZETİ (Son güncelleme: 2026-04-28)

| Faz | Durum | Açıklama |
|---|---|---|
| Faz 1 — Foundation | ✅ TAMAMLANDI | DataSeeder + enum/null fix'ler |
| Faz 2 — Feed Endpoint | ✅ TAMAMLANDI | `GET /api/users` çalışıyor, Postman 25/25 yeşil |
| **Faz 2.5 — Compatibility Skoru** | ✅ **TAMAMLANDI** | CompatibilityService + FeedService sort + Postman 8 test |
| **Faz 3 — MatchDto Zenginleştirme** | ✅ **TAMAMLANDI** | isNewMatch + matchedUser (UserSummaryDto) + compatibility + lastMessage null |
| Faz 4 — Property API | BEKLİYOR | |
| Faz 5 — Mesajlaşma API | BEKLİYOR | |
| Faz 6 — Frontend Bağlama | BEKLİYOR | |
| Faz 7+ — İleri özellikler | BEKLİYOR | SignalR, push, photo upload, vs. |

---

## Faz 1 — Foundation ✅ TAMAMLANDI

- `JsonStringEnumConverter` register edildi (Program.cs)
- `RoomType` enum'una `Studio` eklendi, `RoomType?` nullable yapıldı
- `UserProfileDto` enum tipini doğrudan kullanır (string yerine)
- `Cleanliness` / `SocialLevel` ölçeği 1-5'e indirildi (DataSeeder)
- Migration: `MakeRoomTypeNullable`

---

## Faz 2 — Feed Endpoint ✅ TAMAMLANDI

**Amaç:** Kullanıcının swipe için aday kullanıcı listesini alacağı endpoint. Frontend'in `useUsers` hook'u bunu bekliyor.

### Ne yapıldı (kod tarafı)

| Dosya | Durum | Görevi |
|---|---|---|
| `Application/DTOs/User/UserSummaryDto.cs` | ✨ Yeni | Feed kartı için DTO. Frontend `User` type ile 1:1. CharacterProfile/MatchesCount/LikedProfilesCount dahil DEĞİL (heavy/internal). |
| `Application/Interfaces/Services/IFeedService.cs` | ✨ Yeni | `GetFeedAsync(userId, skip, take)` kontratı. |
| `Application/Services/FeedService.cs` | ✨ Yeni | Repository'den entity → DTO mapping. skip/take clamp (max 50 DoS koruması) burada. |
| `Application/Interfaces/Repositories/IUserRepository.cs` | 🔧 Güncellendi | `GetFeedCandidatesAsync(currentUserId, skip, take)` metodu eklendi. |
| `Infrastructure/Repositories/UserRepository.cs` | 🔧 Güncellendi | LINQ sorgusu — `AsNoTracking()` + Include(Profile) + filter + sort. |
| `API/Controllers/UsersController.cs` | ✨ Yeni | `GET /api/users` endpoint'i. `[Authorize]`, token'dan userId. |
| `API/Program.cs` | 🔧 Güncellendi | `AddScoped<IFeedService, FeedService>()` register. |

### Endpoint kontratı

```
GET /api/users?skip=0&take=20
Authorization: Bearer <jwt>
→ 200 OK: UserSummaryDto[]
→ 401: token yok/geçersiz
→ 500: beklenmedik hata
```

`take` default 20, max 50 (server-side clamp; client `?take=10000` yollasa bile 50 döner).

### Sıralama mantığı (mevcut)

1. **Hard filter** (DB-level WHERE):
   - `u.Id != currentUserId` (kendisi hariç)
   - `u.Profile != null` (eksik profili olanlar hariç)
   - `!UserSwipes.Any(s.Sender == currentUser && s.Receiver == u)` (swipe ettikleri hariç — Pass/Like/SuperLike fark etmez)

2. **Soft sort** (in-memory, Faz 2.5'te güncellendi):
   - 1. öncelik: bana Like/SuperLike atanlar üstte
   - 2. öncelik: `Compatibility DESC` (uyum skoru)
   - 3. öncelik: `LastActive DESC` (son aktif olanlar)
   - Tüm adaylar çekilir, uyum hesaplanır, sıralanır, **sonra** paginate edilir.

### Postman testleri (`Feed (Faz 2)` klasörü, 25/25 yeşil)

| # | Test | Doğruladığı şey |
|---|---|---|
| 01-02 | Login user1 + user3 | Setup |
| 03 | Basic feed | 200 + array + ≤20 + self filtrelenir + DTO alanları + characterProfile YOK |
| 04 | Token yok → 401 | Auth |
| 05 | `?take=5` | Pagination |
| 06 | `?take=100` | Clamp ≤50 (DoS) |
| 07-08 | Pass at → feed'de yok | Hard filter |
| 09-10 | user3 Like → user1 feed'inde ilk 10'da | Soft sort boost |

### Notlar (gelecekteki ben için)

- **`LocationDto.Distance` (`int`) ↔ frontend `distance?: number` (optional)**: mapping'de `?? 0` kullanıldı. Distance gerçekten önemliyse DTO'yu nullable yapıp frontend'i uydurmak daha doğru — şimdilik bekliyor.
- **`Location` owned type** (DbContext'te `OwnsOne`) → `Profile` ile beraber otomatik yükleniyor, `ThenInclude` gerekmiyor.
- **Postman Türkçe apostrof bug'ı**: JSON-içinde-JS yazarken `'feed'de'` gibi Türkçe stringler JS string'ini ortadan bitiriyor. Çözüm: Postman script'lerinde apostrof olan stringleri **double-quote ile** sarmak (JSON'da `\"...\"`).

---

## Faz 2.5 — Compatibility (Uyum) Skoru ✅ TAMAMLANDI

> Bu faz roadmap'in orijinalinde Faz 7'de "ileri özellikler" altındaydı. Frontend incelendikten sonra **MVP için kritik** olduğu görüldü, öne çekildi.

### Ne yapıldı

| Dosya | Değişiklik |
|---|---|
| `Application/Interfaces/Services/ICompatibilityService.cs` | Yeni — `Calculate(current, candidate)` kontratı |
| `Application/Services/CompatibilityService.cs` | Yeni — 6 boyut, 1-5 ölçeği, MaxDiff=4, default 50.0 (null FinalScores) |
| `Application/DTOs/User/UserSummaryDto.cs` | `Compatibility double?` alanı eklendi |
| `Application/Interfaces/Repositories/IUserRepository.cs` | `GetFeedCandidatesWithLikeStatusAsync` eklendi |
| `Infrastructure/Repositories/UserRepository.cs` | İmplementasyon eklendi (2 sorgu: candidates + likedMeIds HashSet) |
| `Application/Services/FeedService.cs` | Tam yeniden yazıldı — in-memory sort: Like-boost → Compatibility → LastActive, sonra paginate |
| `API/Program.cs` | `ICompatibilityService` DI registration eklendi |
| `Infrastructure/Data/DataSeeder.cs` | BasicTestResults ölçeği 1-10'dan 1-5'e düzeltildi (MaxDiff=4 uyumu) |
| Postman `Compatibility (Faz 2.5)` klasörü | 8 test: compatibility alan kontrolü + Like-boost + testsiz=50.0 |

**Kararlar:** 1-5 ölçeği (frontend formülü ile aynı), default 50.0 (testsiz kullanıcılar feed'e girer), sıralama Like-boost → Compat → LastActive. Pagination in-memory (compat hesaplandıktan sonra) — cross-page ordering sorunu önlendi.

**DB notu:** DataSeeder ölçeği düzeltildi; mevcut dev.db varsa sıfırla ve yeniden başlat (eski seeded kullanıcılar 1-10 skorlu kalır, compatibility hesabı bozuk görünebilir).

### Frontend ne bekliyor?

`frontend/.../components/ProfileCard.tsx` içinde `compatibility?: number` prop'u var. Kartın sağ üst köşesinde renkli badge gösteriliyor:

| Skor | Renk | Metin |
|---|---|---|
| ≥%90 | Yeşil | "Mükemmel Uyum" |
| ≥%75 | Amber | "Çok Uyumlu" |
| ≥%60 | Pembe | "Uyumlu" |
| <%60 | Kırmızı | "Orta Uyum" |

`app/(tabs)/index.tsx`'de `calculateCompatibility()` fonksiyonu var. Şu an **client-side** hesaplıyor:

```
6 boyut: socialEnergy, orderApproach, conflictManagement,
         sharingStyle, lifeRhythm, communicationStyle
fark[i] = |benim_skor[i] - aday_skor[i]|
ortalama_fark = (fark[0] + ... + fark[5]) / 6
uyum_yüzdesi = max(0, ((4 - ortalama_fark) / 4) × 100)
```

Yani **0 fark = %100 uyum**, **maksimum fark (4) = %0 uyum**.

Skor sonrası `users.sort((a,b) => b.compatibility - a.compatibility)` ile yüksekten düşüğe sıralanıyor.

### Verilen kararlar

| Soru | Karar |
|---|---|
| Ölçek | 1-5 (frontend formülü ile birebir, DataSeeder bug'ı da düzeltildi) |
| Testsiz kullanıcı | Default 50.0 — feed'e girer, sona atılmaz |
| Sıralama | Like-boost → Compatibility → LastActive |
| Pagination | In-memory (compat hesabından SONRA) — cross-page ordering sorunu önlendi |
| Gelişmiş formül | Faz 7+'a ertelendi — şimdi sadeleştir |

### Postman (`Compatibility (Faz 2.5)`, 8 test — hepsi yeşil)

| # | Test |
|---|---|
| 01-02 | Login user1 + user3 |
| 03 | user3 → user1 Like (idempotent) |
| 04 | compatibility alanı var, 0-100, hepsi 50 değil |
| 05 | user3 feed'in ilk sırasında (Like-boost) |
| 06-07 | testsiz kullanıcı register + login |
| 08 | testsiz → tüm adaylar 50.0 (FinalScores null) |

---

## Faz 3 — MatchDto Zenginleştirme ✅ TAMAMLANDI

**Amaç:** Frontend Match listesinde tam User obj + son mesaj + isNewMatch bekliyor. Eskiden MatchDto sadece id+name döndürüyordu.

### Ne yapıldı

| Dosya | Değişiklik |
|---|---|
| `Application/DTOs/User/MatchDto.cs` | Yeniden yazıldı: `isNewMatch`, `matchedUser (UserSummaryDto)`, `lastMessage (null)` |
| `Infrastructure/Repositories/MatchRepository.cs` | `.ThenInclude(u => u.Profile)` eklendi (profil yüklenmeden age/photos boş dönerdi) |
| `Application/Services/SwipeService.cs` | `ICompatibilityService` inject edildi, `GetMyMatchesAsync` güncellendi, `MapToDto` eklendi |
| Postman `Match (Faz 3)` | 5 test: karşılıklı Like kurulumu + MatchDto yapı doğrulaması |

### Yeni MatchDto şeması

```json
{
  "matchId": 1,
  "matchedAt": "2026-04-28T10:00:00Z",
  "isNewMatch": true,
  "lastMessage": null,
  "matchedUser": {
    "id": "...", "name": "Berk", "age": 25,
    "photos": [], "compatibility": 78.3, ...
  }
}
```

### Verilen kararlar

| Soru | Karar |
|---|---|
| `isNewMatch` nasıl? | `matchedAt > UtcNow - 24h` — basit, migration yok |
| matchedUser alanları | `UserSummaryDto` reuse — foto, yaş, bio, uyum skoru dahil |
| `lastMessage` | Şimdi alan var, `null` döner — Faz 5'te dolar |

### Postman (`Match (Faz 3)`, 5 test — hepsi yeşil)

| # | Test |
|---|---|
| 01-02 | Login user1 + user2 |
| 03-04 | Karşılıklı Like (idempotent) |
| 05 | MatchDto yapısı: matchId, matchedAt, isNewMatch=true, lastMessage=null, matchedUser objesi, compatibility 0-100 |

---

## Faz 4 — Property API — BEKLİYOR

**Amaç:** Konut/mülk endpoint'leri. Frontend'in `useProperties` hook'u + `properties.tsx` ekranı kullanacak.

### Verilecek kararlar
1. **CRUD'un tamamı mı sadece okuma mı?**
   - Frontend prototipinde kullanıcı property eklemiyor (sadece listeden swipe ediyor) → en azından GET list + GET detail yeter, POST/PUT/DELETE sonra
2. **Filtre alanları?** city, propertyType, priceMax, bedrooms, petsAllowed
3. **Sayfalama** (Faz 2 ile aynı pattern)
4. **Owner kontrolü** (yetkilendirme)
   - POST: token'dan owner ID alınır (hiç body'den alma — güvenlik)
   - PUT/DELETE: sadece `OwnerId == currentUserId` ise izin

### Frontend price formatı
- Backend `Property` entity'sinde: `PriceAmount` (decimal) + `Currency` + `PricePeriod`
- Frontend'in beklediği: tek string `"$2,800/month"`
- DTO mapping (PropertyService içinde):
  ```
  Price = $"{Currency}{PriceAmount:N0}/{PricePeriod}"
  ```

### Yeni dosyalar
- `Application/DTOs/Property/PropertyDto.cs` (frontend type'ına uygun, formatted price ile)
- `Application/Interfaces/Services/IPropertyService.cs`
- `Application/Services/PropertyService.cs`
- `Application/Interfaces/Repositories/IPropertyRepository.cs`
- `Infrastructure/Repositories/PropertyRepository.cs`
- `API/Controllers/PropertyController.cs`
- `Program.cs` — DI register

### Endpointler
- `GET /api/property?city=X&propertyType=Apartment&skip=0&take=20`
- `GET /api/property/{id}`
- `POST /api/property` (Authorize) — body'den OwnerId değil, token'dan!
- `PUT /api/property/{id}` (Authorize, owner-only)
- `DELETE /api/property/{id}` (Authorize, owner-only)

### Migration?
**Hayır** — Property entity zaten var, sadece servis/controller eklenecek.

### Seed verisi
DataSeeder'a 5-10 sahte property eklemek mantıklı — frontend bağlandığında boş liste görmeyelim.

### Postman testleri
- `Property` klasörü: list, get by id, create, update, delete
- non-owner update → 403
- yok olan id → 404
- filtreli liste

---

## Faz 5 — Mesajlaşma API — BEKLİYOR

**Amaç:** Match olan kullanıcılar arasında mesaj gönderme/listeleme. Frontend'in `messages.tsx` ekranı kullanacak.

### Verilecek kararlar
1. **SignalR şimdi mi sonra mı?** REST yeterli başlangıç. Real-time için frontend bağlandıktan sonra SignalR aç (Program.cs'de zaten yorum satırında: `app.MapHub<ChatHub>("/chathub")`).
2. **`IsRead` ne zaman güncellenir?**
   - Karşı taraf mesaj listesini açtığında otomatik mi?
   - Ayrı bir endpoint mi (`PUT .../messages/read`)?
   - Önerim: ayrı endpoint, frontend açtığında çağırır → daha açık akış
3. **Pagination**: mesajlar zamansal, cursor-based daha doğru ama skip/take basit

### Yetkilendirme kuralı (kritik)
- Sadece o match'in **iki tarafından biri** okuyabilir/yazabilir
- MessageService içinde her çağrıda match.User1Id veya match.User2Id == currentUserId kontrolü
- Aksi halde **404** dön (varlığını sızdırma — 403 verirsen "match var ama erişimin yok" dersin)

### Yeni dosyalar
- DTO'lar zaten var (`Application/DTOs/Chat/`) — kontrol et, zenginleştir
- `Application/Interfaces/Services/IMessageService.cs`
- `Application/Services/MessageService.cs`
- `Application/Interfaces/Repositories/IMessageRepository.cs`
- `Infrastructure/Repositories/MessageRepository.cs`
- `API/Controllers/MessageController.cs`
- `Program.cs` — DI register

### Endpointler
- `GET /api/match/{matchId}/messages?skip=0&take=50`
- `POST /api/match/{matchId}/messages` body: `{ content, type }`
- `PUT /api/match/{matchId}/messages/read` — toplu okundu

### Migration?
**Hayır** — Message entity zaten var.

### Postman testleri
- `Messaging` klasörü:
  - mesaj gönder, listele
  - 3. taraf (match'te olmayan user) erişim → 404
  - match yoksa → 404
  - iki user arasında smoke test (user1 gönderir, user2 okur, IsRead güncellenir)

---

## Faz 6 — Frontend Bağlama — BEKLİYOR

**Amaç:** Frontend mock'tan gerçek API'ye geçer.

> ⚠️ **Erken doğrulama**: Faz 2 (feed) bittikten sonra ara doğrulama yap — sadece login + feed'i bağla, mismatch çık varsa şimdi yakala. Aksi halde Faz 5 sonunda 5-6 mismatch birden patlar.

### Frontend'de yapılacak (sırasıyla)

#### 1. API client kur
- `frontend/.../services/api.ts` oluştur
- fetch wrapper veya axios install
- Base URL env'den (`EXPO_PUBLIC_API_URL`)
- Authorization header interceptor (token state'den okur)
- 401 olunca otomatik logout

#### 2. Auth hook'u yaz
- `hooks/useAuth.ts` oluştur
- Context API ile token + user state
- `login`, `register`, `logout` metodları
- App start'ta token check (SecureStore'dan oku)

#### 3. Token persist
- `expo-secure-store` ekle
- `setItemAsync('token', ...)`, `getItemAsync('token')`
- AsyncStorage **kullanma** (token plaintext kalır, security risk)

#### 4. Hook'ları API'ye bağla
| Hook | Backend endpoint |
|---|---|
| `useUsers` | `GET /api/users` (Faz 2) |
| `useMatches` | `GET /api/swipe/matches` |
| `useProperties` | `GET /api/property` (Faz 4) |
| `useCharacterTest` | `POST /api/test/basic`, `/api/test/detailed` |
| `useMessages` (yeni) | `GET/POST /api/match/{id}/messages` (Faz 5) |

#### 5. AuthScreen düzelt
- "Kullanıcı adı" labelini "Email" yap
- Sahte `123/123` mantığını kaldır
- `useAuth.login(email, password)` çağır
- Hata durumunda Alert göster

#### 6. SwipeableCard action'larını bağla
- `onSwipeRight` → `POST /api/swipe { receiverId, swipeType: "Like" }`
- `onSwipeLeft` → `POST /api/swipe { receiverId, swipeType: "Pass" }`
- `onSwipeUp` → `POST /api/swipe { receiverId, swipeType: "SuperLike" }`
- IsMatch=true gelirse "Eşleşme oldu!" modal aç

#### 7. Network ayarı
- Geliştirme: `localhost` gerçek cihazda çalışmaz; bilgisayarın LAN IP'sini kullan (`https://192.168.1.X:7142`)
- Veya Expo tunnel: `expo start --tunnel`
- HTTPS sertifikası dev'de self-signed → fetch tarafında `rejectUnauthorized: false` (sadece dev!)
- Backend CORS Development zaten AllowAnyOrigin

#### 8. Compatibility skor temizliği (Faz 2.5 yapıldıysa)
- `app/(tabs)/index.tsx` içindeki `calculateCompatibility` fonksiyonunu sil
- `usersWithCompatibility` state'ini sil
- Doğrudan `users` listesini kullan, her user'da `compatibility` alanı zaten gelir

### Karşılaşılacak mismatch'ler (önceden bilinenler)
- `PropertyType: 'shared'` (frontend) ↔ `'Room'` (backend) → frontend'de düzelt: `'shared'` → `'room'`
- `swipeType: 'superlike'` (frontend) ↔ `'SuperLike'` (backend) → backend `Enum.TryParse(ignoreCase: true)` zaten kabul ediyor, OK
- `roomType: 'any'` ↔ `null` → frontend'de map: `null` ise `'any'` göster
- Date format: backend ISO 8601 döner, frontend `new Date(string)` ile parse eder
- AuthResponseDto'da `email` yok ama frontend User type'ında lazımsa Profile'dan al
- `LocationDto.distance` int (backend) ↔ `distance?: number` (frontend optional) → backend `?? 0` yapıyor

---

## Faz 7+ — İleri özellikler (sıralama önemsiz)

- **SignalR mesajlaşma**: real-time chat, typing indicator
- **Push notification**: Expo Notifications, match olunca + mesaj geldiğinde
- **Photo upload**: multipart endpoint, blob storage (Azure/local file)
- **Hibrit compatibility motoru**: Faz 2.5'te basit formül kullandıysak, burada lifestyle/interests/lokasyon/oda tipi ağırlıklı skoru ekle
- **Block/report kullanıcı**: yeni entity (UserBlock), feed'de filtrele
- **Premium / SuperLike sayısı**: günlük limit, IAP
- **Match unread badge**: kaç yeni match + kaç okunmamış mesaj
- **Profil görüntüleme sayacı**: `ProfileViewsCount` entity'de duruyor, kullanılmıyor
- **Email doğrulama**: Identity'nin built-in akışı
- **Şifre sıfırlama**: token üretip email gönder
- **Karakter testi view tracking**: `IsViewedByUser1/2` flag (Faz 3'te basit yol seçilmişse, gerçek "yeni mi okudun" semantiği için)

---

## Çalışma stili (notum sana)

- Her faz başında **kararları** kendin ver, "ben düşünüyorum" mesajı yaz, ben review edeyim
- Her faz sonunda Postman testleri yeşil olmadan bir sonraki faza geçme
- Migration gerekiyorsa: `dotnet ef migrations add <Name> -p EvArkadasimV2.Infrastructure -s EvArkadasimV2.API`
- Eğer DB sıfırlamak gerekirse: `dotnet ef database drop ... --force` → `dotnet run`
- Build kontrolü: `dotnet build EvArkadasimV2.API/EvArkadasimV2.API.csproj`
- **Postman script'lerinde Türkçe yazarken**: apostrof olan stringleri (`feed'de`, `user1'in` vb.) **double-quote ile sar** (`\"...\"`); single-quote içine gömülürse JS string'i bitirir, sessiz syntax error olur.

## Komut hatırlatıcısı (sık kullanılacak)

```bash
# build
dotnet build EvArkadasimV2.API/EvArkadasimV2.API.csproj

# çalıştır (dev modunda, auto-migrate + seed)
dotnet run --project EvArkadasimV2.API

# migration ekle
dotnet ef migrations add <MigrationAdı> -p EvArkadasimV2.Infrastructure -s EvArkadasimV2.API

# DB sıfırla (sadece dev!)
dotnet ef database drop -p EvArkadasimV2.Infrastructure -s EvArkadasimV2.API --force

# son migration'ı geri al (henüz apply edilmediyse)
dotnet ef migrations remove -p EvArkadasimV2.Infrastructure -s EvArkadasimV2.API
```

## Önemli dosya konumları

- Frontend types kontrat: `frontend/evarkadasim-yeni-main/types/index.ts`
- Frontend hooks (mock'tan API'ye geçecek): `frontend/evarkadasim-yeni-main/hooks/`
- Frontend ProfileCard (compatibility UX kontratı): `frontend/evarkadasim-yeni-main/components/ProfileCard.tsx`
- Frontend client-side compatibility hesabı: `frontend/evarkadasim-yeni-main/app/(tabs)/index.tsx`
- Postman koleksiyonu: `postman/EvArkadasim V2 API.postman_collection.json`
- Backend Program.cs: `EvArkadasimV2.API/Program.cs`
- Backend DI register: `Program.cs:67-77`

## Frontend'in beklediği ama backend'de henüz olmayan endpoint'ler

| Frontend ihtiyacı | Endpoint | Faz |
|---|---|---|
| `useUsers` (feed) | `GET /api/users` | 2 ✅ |
| Compatibility skoru | `UserSummaryDto.compatibility` alanı | 2.5 ✅ |
| `useMatches` (zengin) | `GET /api/swipe/matches` — isNewMatch + matchedUser + lastMessage | 3 ✅ |
| `useProperties` | `GET /api/property` ve detail | 4 🔜 |
| `messages.tsx` | `GET/POST /api/match/{id}/messages` | 5 🔜 |

---

## Öğrenilenler / Gotcha'lar (gelecekte rastlanırsa)

### Postman + Türkçe apostrof
JSON içinde JS test script'i yazarken Türkçe `'feed'de'`, `'user'in'` gibi stringler single-quote içinde olduğunda JS parser'ı erkenden kapatıyor → sessiz syntax error → değişkenler set edilmiyor → sonraki testler garip 404'lerle düşüyor.

**Tanı:** Postman Console'da `SyntaxError: missing ) after argument list` mesajı.
**Çözüm:** Apostrof içeren stringleri double-quote ile sar (JSON'da `\"...\"` escape ile).

### EF Core OwnsOne + Include
`OwnsOne` ile işaretlenmiş value object'ler (örn. `Location`) parent entity ile **otomatik** yükleniyor. `ThenInclude(p => p.Location)` GEREKMİYOR; aksi halde EF "navigation property değil" hatası verir.

### IdentityUser.Id formatı
`AppUser : IdentityUser` olduğu için `Id` `string` (GUID). Tüm DTO'larda ve referanslarda string olarak taşınmalı.

### LINQ subquery in OrderBy
`OrderByDescending(u => _context.UserSwipes.Any(...))` gibi subquery'ler EF Core tarafından SQL'e çevriliyor (CASE WHEN). SQLite/SQL Server fark etmez. Ama performans için ileride explicit join veya pre-computed flag düşünülebilir.
