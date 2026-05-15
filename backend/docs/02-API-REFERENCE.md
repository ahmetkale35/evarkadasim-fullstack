# API Referansı

## Kimlik Doğrulama

Tüm korumalı endpoint'ler `Authorization` header'ı gerektirir:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

Token, `POST /api/auth/register` veya `POST /api/auth/login` yanıtından alınır.
Geçerlilik süresi: 1440 dakika (24 saat).

---

## Auth Endpoints

### POST `/api/auth/register`

Yeni kullanıcı kaydı oluşturur ve JWT token döner.

**Auth**: Gerekmez

**Request Body**:
```json
{
  "email": "ahmet@example.com",
  "password": "Test1234!",
  "name": "Ahmet",
  "lastName": "Kale",
  "lookingFor": "Room",
  "city": "İstanbul"
}
```

| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| `email` | ✅ | Geçerli e-posta, max 256 karakter |
| `password` | ✅ | Min 8 karakter, büyük harf + rakam + özel karakter |
| `name` | ✅ | 2-100 karakter |
| `lastName` | ✅ | 2-100 karakter |
| `lookingFor` | ✅ | `"Roommate"` veya `"Room"` |
| `city` | — | Opsiyonel, max 100 karakter |

**201 Created — Başarılı**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "d4e5f6a7-b8c9-...",
  "expiration": "2026-04-29T14:30:00.0000000Z",
  "userId": "a1b2c3d4-e5f6-...",
  "name": "Ahmet"
}
```

**400 Bad Request — E-posta zaten kullanımda**:
```json
{ "message": "Bu e-posta adresi zaten kullanımda." }
```

**400 Bad Request — Şifre politikasına uymuyor**:
```json
{ "message": "Kayıt başarısız: Passwords must be at least 8 characters. | ..." }
```

---

### POST `/api/auth/login`

Mevcut kullanıcı girişi yapar ve JWT token döner.

**Auth**: Gerekmez

**Request Body**:
```json
{
  "email": "ahmet@example.com",
  "password": "Test1234!"
}
```

**200 OK — Başarılı**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiration": "2026-04-29T14:30:00.0000000Z",
  "userId": "a1b2c3d4-e5f6-...",
  "name": "Ahmet"
}
```

**401 Unauthorized — Hatalı bilgi**:
```json
{ "message": "E-posta veya şifre hatalı." }
```

> **Güvenlik Notu**: "Kullanıcı bulunamadı" ve "Şifre yanlış" durumlarında aynı mesaj dönülür (user enumeration koruması).

---

### POST `/api/auth/refresh`

Geçerli bir refresh token ile yeni access + refresh token çifti üretir.

**Auth**: Gerekmez

**Request Body**:
```json
{
  "refreshToken": "d4e5f6a7-b8c9-..."
}
```

**200 OK — Başarılı**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "a1b2c3d4-e5f6-...",
  "expiration": "2026-04-29T14:30:00.0000000Z",
  "userId": "a1b2c3d4-e5f6-...",
  "name": "Ahmet"
}
```

**401 Unauthorized — Geçersiz/süresi dolmuş refresh token**:
```json
{ "message": "Geçersiz veya süresi dolmuş refresh token." }
```

---

### POST `/api/auth/logout`

Mevcut access token ve refresh token'ı iptal ederek çıkış yapar.

**Auth**: Bearer Token (Zorunlu)

**Headers** (opsiyonel):
```
X-Refresh-Token: d4e5f6a7-b8c9-...
```

Refresh token gönderilirse veritabanından da silinir. Access token'ın `jti` claim'i in-memory blocklist'e eklenir — süresi dolana kadar `TokenRevocationMiddleware` tarafından reddedilir.

**204 No Content**: Başarılı çıkış (body dönmez).

**401 Unauthorized**: Token yok veya geçersiz.

---

## Profile Endpoints

### GET `/api/profile`

Giriş yapmış kullanıcının profilini getirir.

**Auth**: Bearer Token (Zorunlu)

**200 OK**:
```json
{
  "id": "a1b2c3d4-e5f6-...",
  "name": "Ahmet",
  "lastName": "Kale",
  "age": 25,
  "bio": "Yazılım mühendisi, ev arkadaşı arıyorum.",
  "budget": "5000 TL",
  "moveInDate": "2026-06-01",
  "lifestyle": ["Sigara içmez", "Spor yapar"],
  "photos": ["https://..."],
  "location": { "city": "İstanbul", "distance": 5 },
  "interests": ["Müzik", "Sinema"],
  "occupation": "Yazılım Mühendisi",
  "education": "Lisans",
  "roomType": "Private",
  "lookingFor": "Roommate",
  "isVerified": false,
  "lastActive": "2026-04-28T10:00:00Z",
  "cleanliness": 4,
  "socialLevel": 3,
  "characterProfile": { ... },
  "initialBasicTestResults": { ... },
  "finalScores": { ... },
  "likedProfilesCount": 12,
  "matchesCount": 3,
  "compatibilityScore": 0,
  "hasProperty": true
}
```

**404 Not Found**: `{ "message": "Profil bulunamadı." }`

---

### PUT `/api/profile`

Kullanıcının profilini kısmen günceller. Sadece gönderilen alanlar güncellenir, gönderilmeyen alanlar değişmez (partial update).

**Auth**: Bearer Token (Zorunlu)

**Request Body** (tüm alanlar opsiyonel — null gelen alanlar atlanır):
```json
{
  "firstName": "Ahmet",
  "lastName": "Kale",
  "age": 26,
  "bio": "Yeni bio metnim",
  "city": "İstanbul",
  "budget": "6000 TL",
  "moveInDate": "2026-07-01",
  "occupation": "Yazılım Mühendisi",
  "education": "Yüksek Lisans",
  "lifestyle": ["Sigara içmez", "Erken kalkar"],
  "interests": ["Müzik", "Yemek", "Seyahat"],
  "photos": ["https://new-photo-url.jpg"],
  "cleanliness": 5,
  "socialLevel": 4,
  "isOnlineStatusVisible": true,
  "notificationsEnabled": false,
  "lookingFor": "Roommate"
}
```

**İş Kuralı**: `lookingFor` alanı `"Roommate"` olarak ayarlanırken kullanıcının en az bir property ilanı olmalıdır. Yoksa `400 DomainException` döner: "Ev sahibi olmak için önce bir ilan eklemelisiniz."
```

**200 OK**: `{ "message": "Profil başarıyla güncellendi." }`

**404 Not Found**: `{ "message": "Kullanıcı bulunamadı." }`

---

## Feed Endpoint

### GET `/api/users?skip=0&take=20`

Swipe edilecek aday kullanıcı listesini döndürür.

**Auth**: Bearer Token (Zorunlu)

**Query Parameters**:

| Parametre | Tip | Varsayılan | Max | Açıklama |
|-----------|-----|------------|-----|----------|
| `skip` | int | 0 | — | Atlanacak kayıt sayısı |
| `take` | int | 20 | 50 | Alınacak kayıt sayısı |

**Filtreleme (Otomatik)**:
- Kullanıcının kendisi listede yer almaz
- Daha önce swipe edilen kullanıcılar listede yer almaz
- Profili olmayan kullanıcılar filtrelenir
- **Şehir filtresi**: Kullanıcının şehriyle eşleşen adaylar gösterilir (şehir yoksa tümü)
- **Rol filtresi**: `LookingFor = Roommate` olan kullanıcılar yalnızca `Room` arayanları görür

**Sıralama (Ağırlıklı Skor)**:
```
finalScore = likeWeight × 40 + uyumluluk × 0.35 + activityScore × 15 + profileScore
```
- `likeWeight`: Pass=0, Like=1, SuperLike=2 (bizi beğenmişse)
- `activityScore`: <7gün=1.0, <30gün=0.5, <90gün=0.25, >=90gün=0.0
- `profileScore`: foto(+5) + bio(+3) + ≥3 ilgi(+2)

**200 OK**:
```json
{
  "users": [
    {
      "id": "b2c3d4e5-f6a7-...",
      "name": "Zeynep",
      "age": 23,
      "bio": "Ev arkadaşı arıyorum.",
      "budget": "4000 TL",
      "moveInDate": "2026-05-15",
      "lifestyle": ["Evcil hayvan sever"],
      "photos": [],
      "location": { "city": "İstanbul", "distance": 12 },
      "interests": ["Yoga", "Sinema"],
      "occupation": "Tasarımcı",
      "education": "Yüksek Lisans",
      "roomType": "Shared",
      "lookingFor": "Room",
      "isVerified": false,
      "lastActive": "2026-04-28T09:00:00Z",
      "cleanliness": 5,
      "socialLevel": 4,
      "compatibility": 78.3,
      "hasProperty": false
    }
  ],
  "skip": 0,
  "take": 20,
  "totalCount": 45,
  "hasMore": true
}
```

**Alan Açıklamaları**:

| Alan | Tip | Açıklama |
|------|-----|----------|
| `users` | `UserSummaryDto[]` | Sayfalanmış kullanıcı listesi |
| `skip` | int | Bu sayfada atlanan kayıt sayısı |
| `take` | int | İstenen kayıt sayısı (clamp edilmiş) |
| `totalCount` | int | Filtreleme sonrası toplam aday sayısı |
| `hasMore` | bool | `skip + take < totalCount` ise `true` — daha fazla sayfa var |

---

### GET `/api/users/{id}`

Belirli bir kullanıcının profilini ve uyumluluk skorunu döndürür.

**Auth**: Bearer Token (Zorunlu)

**200 OK**: `UserSummaryDto` formatında tek nesne (compatibility skoru dahil).

**404 Not Found**: Kullanıcı veya profili bulunamazsa.

---

## Swipe Endpoints

### POST `/api/swipe`

Sender (token sahibi) receiver'a swipe atar. İki taraf da Like/SuperLike atmışsa otomatik eşleşme oluşur.

**Auth**: Bearer Token (Zorunlu)

**Request Body**:
```json
{
  "receiverId": "b2c3d4e5-f6a7-...",
  "swipeType": "Like"
}
```

| swipeType | Açıklama |
|-----------|----------|
| `Like` | Beğenme |
| `Pass` | Geçme (eşleşme tetiklemez) |
| `SuperLike` | Süper beğenme |

**200 OK — Eşleşme yok**:
```json
{
  "isMatch": false,
  "matchedUserId": null,
  "message": "Swipe kaydedildi."
}
```

**200 OK — Eşleşme var!**:
```json
{
  "isMatch": true,
  "matchedUserId": "b2c3d4e5-f6a7-...",
  "message": "Eşleşme oldu!"
}
```

**400 Bad Request**:
```json
{ "message": "Kendinize swipe işlemi yapamazsınız." }
{ "message": "Geçersiz swipe tipi. Geçerli değerler: Like, Pass, SuperLike." }
{ "message": "Bu kullanıcıya zaten swipe yaptınız." }
```

**404 Not Found**: `{ "message": "Eşleşilecek kullanıcı bulunamadı." }`

---

### GET `/api/swipe/matches`

Kullanıcının tüm eşleşmelerini en yeniden eskiye listeler.

**Auth**: Bearer Token (Zorunlu)

**200 OK**:
```json
[
  {
    "matchId": 1,
    "matchedAt": "2026-04-28T08:30:00Z",
    "isNewMatch": true,
    "matchedUser": {
      "id": "b2c3d4e5-...",
      "name": "Zeynep",
      "age": 23,
      "compatibility": 85.2
    },
    "lastMessage": null
  }
]
```

> `isNewMatch`: Son 24 saat içinde oluşan eşleşmeler için `true`.

---

## Property Endpoints

### GET `/api/property?location=istanbul&propertyType=Apartment&maxPrice=5000&bedrooms=2&petsAllowed=true&skip=0&take=20`

Filtrelenebilir ilan listesini döndürür.

**Auth**: Bearer Token (Zorunlu)

**Query Parameters**:

| Parametre | Tip | Varsayılan | Zorunlu | Açıklama |
|-----------|-----|------------|---------|----------|
| `location` | string | — | Hayır | Lokasyon filtresi (contains arama) |
| `propertyType` | PropertyType | — | Hayır | `Apartment`, `House`, `Studio`, `SharedRoom` |
| `maxPrice` | decimal | — | Hayır | Maksimum fiyat filtresi |
| `bedrooms` | int | — | Hayır | Yatak odası sayısı |
| `petsAllowed` | bool | — | Hayır | Evcil hayvan izni |
| `skip` | int | 0 | Hayır | Atlanacak kayıt sayısı |
| `take` | int | 20 | Hayır | Alınacak kayıt sayısı (max 50) |

**200 OK**:
```json
[
  {
    "id": 1,
    "title": "Kadıköy Merkez 2+1 Daire",
    "price": "₺8,500/ay",
    "location": "Kadıköy, İstanbul",
    "bedrooms": 2,
    "bathrooms": 1,
    "images": ["https://..."],
    "description": "Metro ve tramvay hattına yürüme mesafesinde...",
    "amenities": ["WiFi", "Klima", "Çamaşır makinesi"],
    "availableFrom": "2026-06-01T00:00:00",
    "propertyType": "Apartment",
    "furnished": true,
    "petsAllowed": false,
    "smokingAllowed": false,
    "ownerId": "a1b2c3d4-...",
    "ownerName": "Ahmet Yılmaz"
  }
]
```

---

### GET `/api/property/{id}`

Belirli bir ilanın detayını getirir.

**Auth**: Bearer Token (Zorunlu)

**200 OK**: Yukarıdaki `PropertyDto` formatında tek nesne.

**404 Not Found**: `{ "message": "İlan bulunamadı. Id: 99" }`

---

### POST `/api/property`

Yeni ilan oluşturur. `ownerId` otomatik olarak token'dan alınır.

**Auth**: Bearer Token (Zorunlu)

**Request Body**:
```json
{
  "title": "Beşiktaş 1+1 Stüdyo",
  "priceAmount": 6500,
  "currency": "₺",
  "pricePeriod": "ay",
  "location": "Beşiktaş, İstanbul",
  "bedrooms": 1,
  "bathrooms": 1,
  "images": [],
  "description": "Boğaz manzaralı stüdyo daire.",
  "amenities": ["WiFi", "Asansör"],
  "availableFrom": "2026-07-01T00:00:00",
  "propertyType": "Studio",
  "furnished": true,
  "petsAllowed": true,
  "smokingAllowed": false,
  "latitude": 41.0422,
  "longitude": 29.0077
}
```

**Yan Etki**: İlan oluşturulduğunda, kullanıcının `LookingFor` alanı henüz `Roommate` değilse otomatik olarak `Roommate` olarak güncellenir.

**Validation Kuralları**:

| Alan | Kural |
|------|-------|
| `title` | Zorunlu, 3-200 karakter |
| `priceAmount` | 0 - 1.000.000 arası |
| `currency` | Zorunlu, max 10 karakter |
| `pricePeriod` | Zorunlu, max 20 karakter |
| `location` | Zorunlu, 2-200 karakter |
| `bedrooms` / `bathrooms` | 0-20 arası |
| `description` | Opsiyonel, max 2000 karakter |

**201 Created**: Oluşturulan `PropertyDto` döner. `Location` header'ında yeni kaynağın URL'i.

---

### PUT `/api/property/{id}`

Mevcut ilanı günceller. **Sadece ilan sahibi güncelleyebilir.**

**Auth**: Bearer Token (Zorunlu)

**Request Body**: `CreatePropertyDto` ile aynı formatta (tüm alanlar zorunlu).

**200 OK**: Güncellenmiş `PropertyDto` döner.

**404 Not Found**: `{ "message": "İlan bulunamadı. Id: 99" }`

**403 Forbidden**: Token'daki kullanıcı ilan sahibi değilse (body boş döner).

---

### DELETE `/api/property/{id}`

İlanı siler. **Sadece ilan sahibi silebilir.**

**Auth**: Bearer Token (Zorunlu)

**204 No Content**: Başarılı silme (body boş).

**404 Not Found**: `{ "message": "İlan bulunamadı. Id: 99" }`

**403 Forbidden**: Token'daki kullanıcı ilan sahibi değilse.

---

### GET `/api/property/map?city=İstanbul`

Koordinatı olan tüm ilanları harita pin'i olarak döner.

**Auth**: Bearer Token (Zorunlu)

**Query Parameters**: `city` (opsiyonel) — belirtilirse sadece o şehirdeki ilanlar gelir.

**200 OK**:
```json
[
  {
    "id": 1,
    "latitude": 41.0422,
    "longitude": 29.0077,
    "title": "Beşiktaş'ta Ferah 2+1 Daire",
    "price": "₺15,000/ay",
    "location": "İstanbul, Beşiktaş",
    "propertyType": "Apartment",
    "ownerId": "a1b2c3d4-...",
    "ownerName": "Can Akın"
  }
]
```

---

### GET `/api/property/mine`

Oturum açan kullanıcının kendi ilanını döner.

**Auth**: Bearer Token (Zorunlu)

**200 OK**: `PropertyDto` formatında tek nesne.

**204 No Content**: Kullanıcının ilanı yoksa.

---

### DELETE `/api/property/mine`

Oturum açan kullanıcının tüm ilanlarını siler.

**Auth**: Bearer Token (Zorunlu)

**204 No Content**: Başarılı silme.

---

### DELETE `/api/swipe/passes`

Kullanıcının tüm "Pass" swipe'larını siler. Feed boşaldığında "Başa Dön" özelliği için kullanılır. Like/SuperLike swipe'larına dokunmaz (match mantığı korunur).

**Auth**: Bearer Token (Zorunlu)

**200 OK**:
```json
{ "deletedCount": 42 }
```

**Yan etki**: `feed:{userId}:v2` Redis cache invalidate edilir — kullanıcı aynı adayları tekrar görür.

---

## Test Endpoints

### POST `/api/test/basic`

Temel kişilik testi sonuçlarını kaydeder. Her skor 1-5 arası `double` değerdir.

**Auth**: Bearer Token (Zorunlu)

**Request Body**:
```json
{
  "socialEnergy": 3.5,
  "orderApproach": 4.0,
  "conflictManagement": 2.5,
  "sharingStyle": 4.0,
  "lifeRhythm": 3.0,
  "communicationStyle": 4.5
}
```

**200 OK**: `{ "message": "Temel test sonuçları başarıyla kaydedildi." }`

---

### POST `/api/test/detailed`

Detaylı kişilik testi sonuçlarını kaydeder. Temel testin tamamlanmış olması zorunludur.

**Auth**: Bearer Token (Zorunlu)

**Request Body**:
```json
{
  "detailedSocialEnergy": [3, 4, 3, 5, 2],
  "detailedOrderApproach": [4, 4, 3, 5, 4],
  "detailedConflictManagement": [2, 3, 2, 3, 1],
  "detailedSharingStyle": [4, 5, 3, 4, 4],
  "detailedLifeRhythm": [3, 3, 2, 4, 3],
  "detailedCommunicationStyle": [4, 5, 4, 5, 4]
}
```

**200 OK**: `{ "message": "Detaylı test sonuçları başarıyla kaydedildi." }`

**400 Bad Request**:
```json
{ "message": "Detaylı testi göndermeden önce temel testi tamamlamalısınız." }
{ "message": "SocialEnergy boyutu boş olamaz." }
```

---

## Messaging Endpoints

Tüm endpoint'ler `[Authorize]` gerektirir. Kullanıcı o match'e dahil değilse `403 Forbidden` döner.

---

### GET `/api/message/{matchId}?page=1&pageSize=50`

Bir match'e ait mesajları kronolojik sırayla döner. Sayfalama desteklenir.

**Auth**: Bearer Token (Zorunlu)

**Query Parameters**:

| Parametre | Tip | Varsayılan | Max | Açıklama |
|-----------|-----|------------|-----|----------|
| `page` | int | 1 | — | Sayfa numarası (1-tabanlı). 1'den küçük değerler 1 olarak işlenir |
| `pageSize` | int | 50 | 100 | Sayfa başına mesaj sayısı. 100'den büyük veya 1'den küçük değerler 50'ye sıfırlanır |

**200 OK**:
```json
{
  "messages": [
    {
      "id": 1,
      "senderId": "a1b2c3d4-...",
      "content": "Merhaba, ev arkadaşı olabilir miyiz?",
      "timestamp": "2026-04-29T10:00:00Z",
      "type": "text",
      "isRead": false
    }
  ],
  "page": 1,
  "pageSize": 50,
  "totalCount": 6,
  "hasMore": false
}
```

**Alan Açıklamaları**:

| Alan | Tip | Açıklama |
|------|-----|----------|
| `messages` | `MessageDto[]` | Kronolojik sırayla mesaj listesi |
| `page` | int | Mevcut sayfa numarası |
| `pageSize` | int | Sayfa başına kayıt sayısı |
| `totalCount` | int | Bu match'e ait toplam mesaj sayısı |
| `hasMore` | bool | `page * pageSize < totalCount` ise `true` — önceki sayfalar var |

**403 Forbidden**: Kullanıcı bu match'e dahil değil.

**404 Not Found**: `{ "message": "Eşleşme bulunamadı. Id: 99" }`

---

### POST `/api/message`

Yeni mesaj gönderir.

**Auth**: Bearer Token (Zorunlu)

**Request Body**:
```json
{
  "matchId": 1,
  "content": "Merhaba, ev arkadaşı olabilir miyiz?",
  "type": "text"
}
```

`type` geçerli değerler: `"text"`, `"image"`, `"gif"`

**201 Created**:
```json
{
  "id": 42,
  "senderId": "a1b2c3d4-...",
  "content": "Merhaba, ev arkadaşı olabilir miyiz?",
  "timestamp": "2026-04-29T10:00:00Z",
  "type": "text",
  "isRead": false
}
```

**400 Bad Request**: Boş içerik veya geçersiz `type` (validation hatası).

**403 Forbidden**: Kullanıcı bu match'e dahil değil.

**404 Not Found**: Match bulunamadı.

---

### PUT `/api/message/{matchId}/read`

Karşı tarafın okunmamış mesajlarını toplu olarak okundu işaretler. Kendi gönderdiğin mesajları etkilemez.

**Auth**: Bearer Token (Zorunlu)

**204 No Content**: Başarılı. Body dönmez.

**403 Forbidden**: Kullanıcı bu match'e dahil değil.

**404 Not Found**: Match bulunamadı.

---

## Health Endpoint

### GET `/health`

Uygulamanın çalışıp çalışmadığını kontrol eder (liveness check).

**Auth**: Gerekmez

**200 OK**: `Healthy`

---

## Hata Yanıt Formatı

`GlobalExceptionMiddleware` tüm hataları merkezi olarak yakalar. Tüm hata yanıtları aynı formattadır:

```json
{ "statusCode": 400, "message": "Hata açıklaması" }
```

### Exception Hiyerarşisi

Tüm öngörülen hatalar `AppException` base class'ından türer. Her alt sınıf kendi HTTP status kodunu taşır:

| HTTP Kodu | Exception Tipi | Anlamı |
|-----------|---------------|--------|
| 400 | `DomainException` | İş kuralı ihlali (kendine swipe, mükerrer swipe, vb.) |
| 401 | `UnauthorizedException` | Kimlik doğrulama hatası (yanlış şifre, geçersiz token) |
| 403 | `ForbiddenException` | Yetkilendirme hatası (başkasının ilanı/match'i) |
| 404 | `NotFoundException` | Kaynak bulunamadı |
| 500 | `Exception` (catch-all) | Beklenmedik sunucu hatası |

> **Güvenlik**: `AppException` alt sınıfları için stack trace loglanmaz (beklenen iş akışı). Beklenmedik `Exception`'larda stack trace sunucu loguna yazılır ama client'a sızdırılmaz.
