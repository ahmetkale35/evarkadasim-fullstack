# EvArkadasimV2 — Kod Analizi (Eğitim Amaçlı) — Part 1

> **Bu belge ne?** Projedeki her dosyanın, her satırın neden orada olduğunu açıklayan eğitim/öğrenme belgesidir. Bir "neden böyle yapılmış?" sorusuna cevap verir. Profesyonel referans için [Dokümantasyon bölümüne](./README.md#-dokümantasyon-profesyonel-referans) bakın.

---

## 🏗️ Proje Ne Yapıyor?

**EvArkadasimV2**, bir **ev arkadaşı eşleştirme uygulaması**. Tinder benzeri swipe mekanizmasıyla çalışır: kullanıcılar kişilik testi çözer, sistem uyumluluk skoru hesaplar, kullanıcılar birbirlerini beğenir ve eşleşme olursa mesajlaşabilirler.

---

## 🧱 Mimari: Clean Architecture (Temiz Mimari)

### Proje Katman Diyagramı

```
┌──────────────────────────────────────────────┐
│  API (Sunum)                                 │
│  Controllers, Program.cs, Middleware         │
│  Bağımlı: Application, Infrastructure       │
├──────────────────────────────────────────────┤
│  Application (İş Mantığı)                    │
│  Services, DTOs, Interfaces, Exceptions      │
│  Bağımlı: Domain                             │
├──────────────────────────────────────────────┤
│  Infrastructure (Altyapı)                    │
│  Repositories, DbContext, TokenService       │
│  Bağımlı: Application, Domain               │
├──────────────────────────────────────────────┤
│  Domain (Çekirdek)                           │
│  Entities, Enums, Value Objects              │
│  Bağımlı: HİÇBİR ŞEY                       │
└──────────────────────────────────────────────┘
```

**Kural**: Bağımlılık okları her zaman içe doğru gider. Domain hiçbir şeye bağımlı değildir.

### Neden Bu Mimari?

| Kural | Açıklama |
|-------|----------|
| **Bağımlılık Yönü** | Oklar her zaman dıştan içe gider. API → Application → Domain. Infrastructure da Application'a bağımlıdır ama Domain'e doğrudan erişir |
| **Domain Bağımsızlığı** | Domain katmanı HİÇBİR şeye bağımlı değil. Veritabanı, HTTP, framework bilmez |
| **Interface Segregation** | Application katmanı interface tanımlar, Infrastructure uygular. Bu sayede veritabanı teknolojisi değişse bile iş mantığı etkilenmez |
| **Dependency Inversion** | SwipeService `ISwipeRepository`'ye bağımlı, `SwipeRepository`'ye değil. Somut yerine soyuta bağımlılık |

---

## 📦 KATMAN 1: DOMAIN (Çekirdek)

### 1.1 Entity: AppUser

```csharp
public class AppUser : IdentityUser  // ASP.NET Identity'den miras
{
    public string? Name { get; set; }
    public UserProfile Profile { get; set; } = null!;  // null-forgiving
}
```

**`IdentityUser` Kalıtımı**: `AppUser`, ASP.NET Identity'nin `IdentityUser` sınıfından türetilmiş. Bu sınıf hazır olarak `Id` (GUID string), `Email`, `UserName`, `PasswordHash`, `PhoneNumber` gibi alanları sağlar. Böylece kullanıcı yönetimi, şifre hashleme, token üretimi gibi işlemleri sıfırdan yazmak gerekmez.

**`null!` (Null-Forgiving Operator)**: C# derleyicisi nullable açıkken `Profile`'ın null olabileceği uyarısı verir. `= null!` derleyiciye "ben garantiliyorum, bu çalışma zamanında null olmayacak" der. Bu güvence `AuthService.RegisterAsync`'te sağlanır — her `AppUser` bir `UserProfile` ile birlikte oluşturulur.

---

### 1.2 Entity: UserProfile

```csharp
public class UserProfile
{
    public int Id { get; set; }
    public string AppUserId { get; set; }     // Foreign Key → AppUser.Id
    public AppUser AppUser { get; set; }       // Navigation Property (ters yön)

    // Temel bilgiler
    public int Age { get; set; }
    public string? Bio { get; set; }
    public string? Budget { get; set; }        // "5000 TL" gibi string
    public string? MoveInDate { get; set; }    // "2026-05-15" gibi string

    // Koleksiyonlar (DB'de JSON olarak saklanır)
    public List<string>? Lifestyle { get; set; } = new List<string>();
    public List<string>? Photos { get; set; } = new List<string>();
    public List<string>? Interests { get; set; } = new List<string>();

    // Enum'lar (nullable → "fark etmez" anlamında)
    public RoomType? RoomType { get; set; }      // Private, Shared, Studio veya null
    public LookingFor? LookingFor { get; set; }  // Roommate, Room, Both

    // Value Objects (EF Owned Types)
    public Location? Location { get; set; }
    public BasicTestResults? InitialBasicTestResults { get; set; }
    public BasicTestResults? FinalScores { get; set; }
    public DetailedTestResults? DetailedTestResults { get; set; }

    // İstatistikler
    public int LikedProfilesCount { get; set; } = 0;
    public int MatchesCount { get; set; } = 0;
    public int ProfileViewsCount { get; set; } = 0;
}
```

**Öğrenilecek Kavramlar:**

| Kavram | Kullanım | Açıklama |
|--------|----------|----------|
| **Navigation Property** | `AppUser AppUser` | EF Core ilişki yönetimi. Include() ile eager load yapılır |
| **Nullable Reference** | `string? Bio` | C# 10 nullable feature. `null` gelebilir demek |
| **Nullable Value Type** | `RoomType?` | Enum null olabilir → "tercih belirtmemiş" anlamında |
| **Owned Type** | `Location`, `BasicTestResults` | Ayrı tablo değil, aynı tabloda sütun olarak saklanır |
| **Default Value** | `= new List<string>()` | Null reference exception'dan korunma |

---

### 1.3 Entity: UserSwipe ve UserMatch

```csharp
// UserSwipe — Tek yönlü beğeni kaydı
public class UserSwipe
{
    public int Id { get; set; }
    public string SenderId { get; set; }      // Swipe'ı atan
    public AppUser Sender { get; set; }
    public string ReceiverId { get; set; }    // Swipe'ı alan
    public AppUser Receiver { get; set; }
    public SwipeType SwipeType { get; set; }  // Like, Pass, SuperLike
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    // ↑ DateTime.UtcNow: Her zaman UTC kullanılır.
    // Farklı zaman dilimlerindeki kullanıcılar arasında tutarlılık sağlar.
}

// UserMatch — İki taraflı eşleşme
public class UserMatch
{
    public int Id { get; set; }
    public string User1Id { get; set; }
    public string User2Id { get; set; }
    public DateTime MatchedAt { get; set; } = DateTime.UtcNow;
    public bool User1HasSeen { get; set; } = false;   // "yeni eşleşme" bildirimi
    public bool User2HasSeen { get; set; } = false;
    public double CompatibilityScore { get; set; }
    public ICollection<Message> Messages { get; set; } = new List<Message>();  // 1:N ilişki
}
```

---

### 1.4 Value Objects

```csharp
[Owned]  // EF Core: ayrı tablo değil, parent tablonun sütunları olarak sakla
public class BasicTestResults
{
    public double SocialEnergy { get; set; }        // 1-5 ölçek
    public double OrderApproach { get; set; }
    public double ConflictManagement { get; set; }
    public double SharingStyle { get; set; }
    public double LifeRhythm { get; set; }
    public double CommunicationStyle { get; set; }

    [NotMapped]  // DB'ye yazılmaz, runtime'da hesaplanır
    public string PersonalityType
    {
        get
        {
            var e_i = SocialEnergy > 3 ? "E" : "I";       // Dışa/İçe dönük
            var s_f = OrderApproach > 3 ? "S" : "F";       // Yapılandırılmış/Esnek
            var d_h = ConflictManagement > 3 ? "D" : "H";  // Doğrudan/Hassas
            return $"{e_i}{s_f}{d_h}";  // Örn: "ESD", "IFH"
        }
    }
}
```

**`[Owned]` Attribute**: EF Core'a "bu sınıf kendi başına bir entity değil, parent entity'nin parçası" der. `UserProfile` tablosunda `InitialBasicTestResults_SocialEnergy`, `FinalScores_SocialEnergy` gibi sütunlar oluşturur. Ayrı tablo + JOIN maliyetinden kurtarır.

**`[NotMapped]`**: `PersonalityType` veritabanında saklanmaz. Her erişimde mevcut skorlardan hesaplanır. Avantaj: veri tutarsızlığı riski yok.

---

### 1.5 Enum'lar

```csharp
public enum SwipeType   { Pass, Like, SuperLike }
public enum RoomType    { Private, Shared, Studio }
public enum LookingFor  { Roommate, Room, Both }
public enum PropertyType{ Apartment, Studio, House, Room }
public enum MessageType { Text, Image, Gif, System }
```

**Neden `RoomType`'ta "Any" yok?** Frontend'de "any" seçeneği var ama bu bir oda tipi değil, "fark etmez" demek. Bu yüzden enum'a eklenmedi, `null` ile temsil ediliyor. Semantik doğruluk: enum sadece gerçek oda tiplerini içerir.

---

## 📦 KATMAN 2: APPLICATION (İş Mantığı)

### 2.1 DTO Mimarisi — Neden DTO Kullanıyoruz?

| Sorun | DTO Çözümü |
|-------|------------|
| Entity doğrudan dönerse `PasswordHash` gibi hassas veriler sızar | DTO sadece gösterilmesi gereken alanları içerir |
| Entity'nin yapısı değişirse API sözleşmesi kırılır | DTO bağımsız, entity değişse bile API aynı kalır |
| Frontend'e gereksiz veri gider (N+1 ilişkiler) | DTO tam olarak ihtiyaç duyulan veriyi taşır |

**UpdateProfileDto — Kısmi Güncelleme Deseni:**

```csharp
public class UpdateProfileDto
{
    public string? Bio { get; set; }         // null = "bu alanı güncelleme"
    public int? Cleanliness { get; set; }    // HasValue = "bu alanı güncelle"
}
// Tüm alanlar nullable. Client sadece değiştirmek istediği alanları gönderir.
// null gelen alan atlanır. HTTP PATCH semantiği olmadan PUT ile kısmi güncelleme.
```

---

### 2.2 Interface'ler — Dependency Inversion

**IGenericRepository — Neden `IQueryable<T>` dönüyor?**

```csharp
public interface IGenericRepository<T> where T : class
{
    IQueryable<T> GetAll(bool tracking = true);
    IQueryable<T> Where(Expression<Func<T, bool>> predicate, bool tracking = true);
    Task AddAsync(T entity);
    void Update(T entity);
    Task<bool> SaveChangesAsync();
}
```

`IQueryable` sorguyu hemen çalıştırmaz — üzerine `.Where()`, `.OrderBy()`, `.Take()` eklenebilir ve TÜM FİLTRELER TEK BİR SQL SORGUSU olarak veritabanına gönderilir. `IEnumerable` olsaydı tüm veri belleğe çekilir, filtreleme C# tarafında yapılırdı.

**`tracking` parametresi**: EF Core varsayılan olarak her entity'yi change tracker'a kaydeder. Okuma işlemlerinde bu gereksiz bellek ve CPU tüketir. `tracking: false` ile `AsNoTracking()` çağrılır — %20-30 performans artışı.

**Neden Application'da EFCore Yok?** Application katmanı EF Core referansı içermez. `AnyAsync()`, `FirstOrDefaultAsync()` gibi EF extension metotlarını kullanamaz. Bu sorgular Infrastructure'daki repository'lere taşınmıştır. Amaç: iş mantığını ORM teknolojisinden bağımsız kılmak.

---

### 2.3 Servisler — Öne Çıkan Kavramlar

#### AuthService — Güvenlik Kararları

**User Enumeration Koruması (Login)**:
```csharp
var isPasswordValid = user != null && await _userManager.CheckPasswordAsync(user, request.Password);
if (!isPasswordValid)
    throw new DomainException("E-posta veya şifre hatalı.");  // ← Aynı mesaj!
```
"Kullanıcı bulunamadı" ve "Şifre yanlış" mesajları birleştirilmiş. Saldırgan hangi e-postaların kayıtlı olduğunu tespit edemez.

**Cascade Insert (Register)**:
```csharp
var user = new AppUser { ..., Profile = new UserProfile() };
await _userManager.CreateAsync(user, request.Password);
// EF Core Profile'ı da otomatik INSERT eder
```

#### SwipeService — Atomik Transaction

Swipe işleminde olabilecek tüm yazma işlemleri (swipe ekleme, match oluşturma, sayaç artışı) TEK `SaveChangesAsync()` çağrısıyla gerçekleşir. Ya hepsi başarılı olur ya da hiçbiri uygulanmaz.

#### CompatibilityService — Formül

```
uyumluluk = max(0, ((maxFark - ortalamaFark) / maxFark) × 100)
// maxFark = 4 (1-5 ölçekte), 6 boyutta mutlak fark ortalaması
```

#### FeedService — Sıralama Önceliği

```
1. HasLikedCurrentUser DESC → Seni beğenenleri öne çıkar
2. Compatibility DESC → Uyumluluğu yüksek olanlar önce
3. LastActive DESC → En son aktif olanlar önce
```

**DoS Koruması**: `MaxTake = 50` — Client `take=10000` gönderse bile 50'ye clamp edilir.

---

### 2.4 Exception Hiyerarşisi

```
Exception (System)
├── DomainException     → 400 Bad Request  (kullanıcı düzeltebilir)
└── NotFoundException   → 404 Not Found    (kayıt bulunamadı)
```

Neden generic `Exception` fırlatmıyoruz? Controller'da catch bloklarında exception tipine göre farklı HTTP kodu dönüyoruz.

---

*Devamı → [Analiz Part 2](./ANALIZ-PART2.md): Infrastructure katmanı, API katmanı ve öğrenilecek kavramlar özeti.*
