# Veritabanı Şeması — Detaylı Açıklama

## 1. Entity-Relationship (Varlık-İlişki) Diyagramı

```
┌──────────────────────┐         ┌───────────────────────────────────┐
│      AppUser          │   1:1   │         UserProfile               │
│──────────────────────│────────▶│───────────────────────────────────│
│ Id (PK, string/GUID)│         │ Id (PK, int, auto-increment)      │
│ Email                │         │ AppUserId (FK → AppUser.Id)       │
│ UserName             │         │ Age (int)                          │
│ PasswordHash         │         │ Bio (string?)                      │
│ Name (string?)       │         │ Budget (string?)                   │
│ ...Identity alanları │         │ MoveInDate (string?)               │
└───────┬──────────────┘         │ Lifestyle (TEXT/JSON)              │
        │                         │ Photos (TEXT/JSON)                 │
        │                         │ Interests (TEXT/JSON)              │
        │                         │ Occupation (string?)               │
        │ N:1                     │ Education (string?)                │
        │ (Sender/Receiver)       │ Location_City (string?)            │
        │                         │ Location_Distance (int?)           │
        ▼                         │ RoomType (int?)                    │
┌──────────────────────┐         │ LookingFor (int?)                  │
│     UserSwipe        │         │ IsVerified (bool)                  │
│──────────────────────│         │ LastActive (datetime)              │
│ Id (PK)              │         │ Cleanliness (int)                  │
│ SenderId (FK)        │         │ SocialLevel (int)                  │
│ ReceiverId (FK)      │         │ InitialBasicTestResults_* (6 col) │
│ SwipeType (int)      │         │ FinalScores_* (6 col)             │
│ CreatedAt (datetime) │         │ DetailedTestResults_* (6 col/JSON)│
└──────────────────────┘         │ LikedProfilesCount (int)           │
                                  │ MatchesCount (int)                 │
┌──────────────────────┐         │ ProfileViewsCount (int)            │
│     UserMatch        │         │ IsOnlineStatusVisible (bool)       │
│──────────────────────│         │ NotificationsEnabled (bool)        │
│ Id (PK)              │         └───────────────────────────────────┘
│ User1Id (FK)         │
│ User2Id (FK)         │
│ MatchedAt (datetime) │      ┌──────────────────────┐
│ User1HasSeen (bool)  │      │     Property         │
│ User2HasSeen (bool)  │      │──────────────────────│
│ CompatibilityScore   │      │ Id (PK)              │
└───────┬──────────────┘      │ OwnerId (FK)         │
        │                      │ Title                │
        │ 1:N                  │ PriceAmount (decimal) │
        ▼                      │ Currency             │
┌──────────────────────┐      │ PricePeriod          │
│     Message          │      │ Location             │
│──────────────────────│      │ Bedrooms             │
│ Id (PK)              │      │ Bathrooms            │
│ UserMatchId (FK)     │      │ Images (TEXT/JSON)   │
│ SenderId (FK)        │      │ Description          │
│ Content (string)     │      │ Amenities (TEXT/JSON)│
│ Timestamp (datetime) │      │ AvailableFrom        │
│ Type (int)           │      │ PropertyType (int)   │
│ IsRead (bool)        │      │ Furnished (bool)     │
└──────────────────────┘      │ PetsAllowed (bool)   │
                               │ SmokingAllowed (bool)│
                               └──────────────────────┘
```

---

## 2. Entity Detayları

### AppUser — Kullanıcı Tablosu

Bu tablo ASP.NET Identity tarafından yönetilir. `IdentityUser` base class'ı aşağıdaki sütunları otomatik ekler:

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `Id` | string (GUID) | `"a1b2c3d4-e5f6-7890-..."` formatında benzersiz kimlik |
| `Email` | string | E-posta adresi (benzersiz) |
| `NormalizedEmail` | string | E-posta karşılaştırması için büyük harfle normalize edilmiş hali |
| `UserName` | string | Kullanıcı adı (bu projede e-posta ile aynı) |
| `PasswordHash` | string | Hashlenmiş şifre. Düz metin ASLA saklanmaz |
| `SecurityStamp` | string | Şifre değiştiğinde güncellenir, eski token'ları geçersiz kılar |
| `ConcurrencyStamp` | string | Eşzamanlı güncelleme çakışmalarını tespit eder |
| `PhoneNumber` | string? | Telefon numarası (opsiyonel) |
| `EmailConfirmed` | bool | E-posta doğrulandı mı? |
| `LockoutEnd` | DateTimeOffset? | Hesap ne zamana kadar kilitli? (brute-force koruması) |
| `AccessFailedCount` | int | Ardışık başarısız giriş sayısı |

Bu projenin eklediği alanlar:

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `Name` | string? | Kullanıcının görünen adı |

**Neden `Id` string (GUID)?** Identity varsayılan olarak GUID kullanır. Integer auto-increment yerine GUID tercih edilmesinin nedenleri:
- Distributed sistemlerde çakışma riski yok
- ID'den kayıt sayısı tahmin edilemez (güvenlik)
- Önceden ID üretilebilir (client-side generation)

### UserProfile — Profil Tablosu

Ayrı tabloda olmasının nedeni: AppUser tablosu Identity tarafından yönetilir, profil alanları uygulama mantığına aittir. Sorumlulukları ayırmak için ayrı tablo.

**Nullable (`string?`) Alanlar**: Kullanıcı henüz profilini tamamlamamış olabilir. Zorunlu olmayan bilgiler nullable yapılmış.

**`Budget` ve `MoveInDate` neden string?** Esneklik: "5000-7000 TL", "Hemen", "Haziran ortası" gibi serbest format değerler kabul edilebilir. Gelecekte `decimal` ve `DateTime` yapılıp validation eklenebilir.

### UserSwipe — Swipe Tablosu

Her satır tek yönlü bir swipe'ı temsil eder: A → B. Tersi (B → A) ayrı satırdır.

**Benzersizlik**: Aynı `(SenderId, ReceiverId)` çifti için sadece bir kayıt olabilir. Bu kural veritabanı seviyesinde unique index ile değil, uygulama katmanında `HasSwipedAsync()` ile kontrol ediliyor.

### UserMatch — Eşleşme Tablosu

İki kullanıcı birbirini beğendiğinde oluşur. `User1Id` her zaman swipe'ı son atan kişidir.

| Sütun | Açıklama |
|-------|----------|
| `User1HasSeen` / `User2HasSeen` | "Yeni eşleşme" badge'i göstermek için. Kullanıcı eşleşmeyi görünce `true` yapılır |
| `CompatibilityScore` | Eşleşme anındaki uyumluluk skoru (şu an kullanılmıyor, match oluşturulurken set edilmiyor) |

### Message — Mesaj Tablosu

Her mesaj bir `UserMatch`'e bağlıdır. Eşleşmemiş kullanıcılar mesajlaşamaz.

**Not**: Mesajlaşma API'si henüz implemente edilmedi. Entity ve DTO'lar hazır ama controller/service yok.

---

## 3. İlişkiler ve OnDelete Davranışları

### Cascade vs Restrict — Neden Farklı?

```
Cascade: "Beni silersen, bağlı kayıtları da sil"
Restrict: "Bağlı kayıtları varsa beni silme, hata ver"
```

| İlişki | Silme Davranışı | Neden? |
|--------|----------------|--------|
| AppUser → UserProfile | **Cascade** | Kullanıcı silinirse profili de silinmeli. Profil kullanıcı olmadan anlamsız |
| UserSwipe → AppUser (Sender) | **Restrict** | A kullanıcısı silinirse, A'nın attığı swipe'lar kaybolur. Ama B'nin swipe geçmişi bozulur. Silme engellenmelidir |
| UserSwipe → AppUser (Receiver) | **Restrict** | Aynı sebep — veri bütünlüğü |
| UserMatch → AppUser (User1/User2) | **Restrict** | Eşleşme iki kişiye ait. Birini silmek diğerinin eşleşme geçmişini bozar |
| UserMatch → Message | **Cascade** | Eşleşme silinirse mesajlar da silinmeli |

**Gerçek dünya senaryosu**: Bir kullanıcı hesabını silmek isterse ne olur?

```
1. Restrict olduğu için doğrudan silemezsin
2. Önce: İlgili UserSwipe kayıtlarını sil
3. Sonra: İlgili UserMatch kayıtlarını sil (cascade ile mesajlar da gider)
4. En son: AppUser'ı sil (cascade ile UserProfile da gider)
```

Bu karmaşık görünüyor ama veri bütünlüğünü garanti altına alır.

---

## 4. Owned Types — Ayrı Tablo Yerine Aynı Tabloda Sütun

### Nedir?

EF Core'da `[Owned]` attribute'u bir sınıfı "bağımsız entity" değil, "parent entity'nin parçası" yapar. Ayrı tablo oluşturmaz, parent tabloya sütun ekler.

### Pratikte Ne Anlama Geliyor?

```csharp
// Domain/ValueObjects/Location.cs
[Owned]
public class Location
{
    public string? City { get; set; }
    public int? Distance { get; set; }
}

// UserProfile'da kullanım:
public Location? Location { get; set; }
```

**Veritabanında oluşan sütunlar** (UserProfiles tablosunda):
- `Location_City` (nvarchar, nullable)
- `Location_Distance` (int, nullable)

Ayrı `Locations` tablosu **YOK**. JOIN **YOK**. Tek sorgu ile tüm profil + lokasyon gelir.

### BasicTestResults — Aynı Sınıf, Farklı Sütun Prefix'leri

`UserProfile`'da 3 tane `BasicTestResults` owned type var:

```csharp
public BasicTestResults? InitialBasicTestResults { get; set; }
public BasicTestResults? FinalScores { get; set; }
// (DetailedTestResults ayrı bir owned type)
```

Her biri 6 sütunla veritabanında şöyle görünür:

```
UserProfiles tablosu:
├── InitialBasicTestResults_SocialEnergy         (float)
├── InitialBasicTestResults_OrderApproach         (float)
├── InitialBasicTestResults_ConflictManagement    (float)
├── InitialBasicTestResults_SharingStyle          (float)
├── InitialBasicTestResults_LifeRhythm            (float)
├── InitialBasicTestResults_CommunicationStyle    (float)
├── FinalScores_SocialEnergy                      (float)
├── FinalScores_OrderApproach                     (float)
├── FinalScores_ConflictManagement                (float)
├── FinalScores_SharingStyle                      (float)
├── FinalScores_LifeRhythm                        (float)
└── FinalScores_CommunicationStyle                (float)
```

**Toplam 12 ekstra sütun** — ama JOIN yok, performans yüksek.

---

## 5. JSON Value Conversion — Liste Alanlarını Tek Sütunda Saklamak

### Problem

İlişkisel veritabanları `List<string>` tipini doğrudan desteklemez. Seçenekler:

| Yaklaşım | Avantaj | Dezavantaj |
|-----------|---------|------------|
| **Ayrı tablo** (UserInterests, UserPhotos) | SQL WHERE yapılabilir, normalize | JOIN gerekir, N+1 riski, karmaşık |
| **JSON string** (tek sütun) | Basit, JOIN yok, tek sorgu | SQL WHERE yapılamaz |
| **Virgülle ayrılmış string** | En basit | Parse hatası riski, virgül içeren veri bozulur |

Bu proje JSON yaklaşımını kullanıyor çünkü bu listeler üzerinde SQL filtreleme yapılmıyor (WHERE gibi).

### Konfigürasyon

```csharp
// AppDbContext.cs — OnModelCreating
entity.Property(e => e.Lifestyle)
    .HasConversion(
        // C# → DB: List<string> → JSON string
        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
        // DB → C#: JSON string → List<string>
        v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null) ?? new()
    );
```

### Somut Örnek

```
C# tarafı:                        Veritabanı (TEXT sütun):
Lifestyle = new List<string>      "["Sigara içmez","Spor yapar","Vejetaryen"]"
{
    "Sigara içmez",
    "Spor yapar",
    "Vejetaryen"
};
```

### `?? new()` — Null Güvenliği

`JsonSerializer.Deserialize` null dönebilir (boş sütun veya "null" string'i). `?? new()` ile null yerine boş liste döner → NullReferenceException engellenir.

---

## 6. Enum Değerleri — DB'de int, API'de string

Veritabanında enum'lar integer olarak saklanır (EF Core varsayılanı):

| Enum | Değer | Veritabanı | API (JSON) |
|------|-------|-----------|------------|
| SwipeType.Pass | 0 | `0` | `"Pass"` |
| SwipeType.Like | 1 | `1` | `"Like"` |
| SwipeType.SuperLike | 2 | `2` | `"SuperLike"` |

**API'de neden string?** `Program.cs`'teki `JsonStringEnumConverter` sayesinde:

```csharp
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
```

Bu olmadan API şöyle dönüyordu: `{ "swipeType": 1 }` — 1 ne demek? Frontend'de enum mapping gerekiyor.
Bu sayede: `{ "swipeType": "Like" }` — kendini açıklayan, okunabilir.

---

## 7. Migration Yönetimi

### Migration Nedir?

Veritabanı şemasını C# kodu olarak versiyonlama sistemidir. Entity'lerde veya konfigürasyonda değişiklik yapınca yeni migration oluşturursun, EF Core farkı hesaplayıp SQL üretir.

### Komutlar

```bash
# Yeni migration oluştur
dotnet ef migrations add AddNewColumn \
  --project EvArkadasimV2.Infrastructure \
  --startup-project EvArkadasimV2.API

# Migration'ı veritabanına uygula
dotnet ef database update \
  --project EvArkadasimV2.Infrastructure \
  --startup-project EvArkadasimV2.API

# Son migration'ı geri al (DB'den)
dotnet ef database update PreviousMigrationName \
  --project EvArkadasimV2.Infrastructure \
  --startup-project EvArkadasimV2.API

# Son migration dosyasını sil (henüz uygulanmamışsa)
dotnet ef migrations remove \
  --project EvArkadasimV2.Infrastructure \
  --startup-project EvArkadasimV2.API

# Veritabanını tamamen sil (sıfırdan başla)
dotnet ef database drop \
  --project EvArkadasimV2.Infrastructure \
  --startup-project EvArkadasimV2.API
```

### Bu Projede Otomatik Migration

```csharp
// Program.cs — Development ortamında:
var db = sp.GetRequiredService<AppDbContext>();
await db.Database.MigrateAsync();  // Bekleyen migration'ları otomatik uygula
```

Bu sayede `dotnet run` yaptığında migration'lar otomatik uygulanır. Manuel `dotnet ef database update` gerekmez.
