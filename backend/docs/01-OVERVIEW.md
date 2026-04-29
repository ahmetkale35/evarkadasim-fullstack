# EvArkadasimV2 — Proje Tanımı ve Mimari

## 1. Proje Ne Yapıyor?

**EvArkadasimV2**, bir ev arkadaşı eşleştirme platformunun backend API'sidir. Uygulamanın çalışma mantığı şöyle:

1. Kullanıcı kayıt olur ve profil oluşturur (yaş, şehir, bütçe, yaşam tarzı vs.)
2. Kişilik testi çözer (6 boyutta 1-5 arası skorlar)
3. Sistem bu skorlara göre diğer kullanıcılarla **uyumluluk yüzdesi** hesaplar
4. Kullanıcı, Tinder benzeri bir arayüzde diğer profilleri görür ve **swipe** yapar (Like / Pass / SuperLike)
5. İki kullanıcı birbirini beğenirse **eşleşme** oluşur
6. Eşleşen kullanıcılar mesajlaşabilir (`GET/POST /api/message/{matchId}`)

### Teknoloji Tablosu

| Bileşen | Teknoloji | Neden Bu? |
|---------|-----------|-----------|
| Framework | ASP.NET Core 6.0 | Microsoft'un modern web framework'ü. Cross-platform, yüksek performans, geniş ekosistem |
| Veritabanı | SQLite | Geliştirme için ideal: kurulum gerektirmez, tek dosya. Üretimde PostgreSQL'e geçilmeli |
| ORM | Entity Framework Core 6 | C# ile SQL yazmadan veritabanı işlemleri. LINQ sorguları SQL'e çevrilir |
| Kimlik Doğrulama | JWT Bearer Token | Stateless auth: sunucu session tutmaz. Mobil uygulama + API için standart |
| Kimlik Yönetimi | ASP.NET Identity | Şifre hashleme, kullanıcı yönetimi, token üretimi hazır gelir |
| API Dokümantasyonu | Swagger / OpenAPI | Tarayıcıda interaktif API test arayüzü |

---

## 2. Hızlı Başlangıç

### Gereksinimler

- **.NET 6 SDK**: [dotnet.microsoft.com](https://dotnet.microsoft.com/download/dotnet/6.0) adresinden indir
- **(Opsiyonel)** Visual Studio 2022+ veya VS Code + C# extension

### Kurulum ve Çalıştırma

```bash
# 1. Repoyu klonla
git clone <repo-url>
cd EvArkadasimV2/backend

# 2. Bağımlılıkları yükle (NuGet paketleri)
dotnet restore

# 3. API projesini çalıştır
cd EvArkadasimV2.API
dotnet run
```

**İlk çalıştırmada otomatik olarak:**
- Veritabanı oluşturulur (`evarkadasimv2.db` dosyası)
- Tüm migration'lar uygulanır (tablolar yaratılır)
- 50 sahte kullanıcı seed edilir

**Swagger UI**: `https://localhost:7xxx/swagger` adresine git (port numarası konsol çıktısında yazar)

### İlk API Çağrısı — Adım Adım

```
1. Swagger UI'ı aç
2. POST /api/auth/login → "Try it out"
3. Body'ye yaz:  { "email": "user1@test.com", "password": "Test1234!" }
4. "Execute" tıkla
5. Yanıttaki "token" değerini kopyala
6. Sayfanın üstündeki 🔓 "Authorize" butonuna tıkla
7. "Bearer " + kopyaladığın token'ı yapıştır:  Bearer eyJhbGci...
8. "Authorize" tıkla
9. Artık tüm korumalı endpoint'leri test edebilirsin!
```

### Seed Verileri (Geliştirme Ortamı)

| Bilgi | Değer | Açıklama |
|-------|-------|----------|
| E-posta formatı | `user1@test.com` ... `user50@test.com` | Sayısal son ek ile kolay test |
| Ortak şifre | `Test1234!` | Identity şifre politikasını karşılar |
| Random seed | `42` (sabit) | Her çalıştırmada aynı veriler üretilir |
| Profil verileri | Rastgele yaş (20-35), şehir, meslek | Gerçekçi test verisi |
| Kişilik skorları | 1-5 arası rastgele | Uyumluluk hesaplaması test edilebilir |

---

## 3. Clean Architecture — Detaylı Açıklama

### Nedir ve Neden Kullanıyoruz?

Clean Architecture, Robert C. Martin'in (Uncle Bob) ortaya koyduğu bir yazılım mimarisi prensibidir. Temel kural: **bağımlılıklar her zaman dıştan içe doğru akar**.

Bunu bir soğan gibi düşün — en içteki katman (Domain) hiçbir şeye bağımlı değildir. En dıştaki katman (API) herkese bağımlıdır.

### Neden Düz Bir Yapı (Hepsi Tek Projede) Kullanmıyoruz?

Küçük bir projede "Controller → DbContext → Entity" şeklinde tek proje yeterli olabilir. Ama bu yaklaşımın sorunları şunlar:

| Sorun | Düz Yapıda | Clean Architecture'da |
|-------|-----------|---------------------|
| **Veritabanı değişikliği** | Her yeri etkiler | Sadece Infrastructure değişir |
| **Test yazma** | DbContext mock'lamak zor | Interface mock'lamak kolay |
| **Takım çalışması** | Herkes aynı dosyalara dokunur | Herkes kendi katmanında çalışır |
| **Kod tekrarı** | İş mantığı controller'lara yayılır | İş mantığı tek yerde (Service) |
| **Bağımlılık karmaşası** | Her şey her şeyi bilir | Net sorumluluk sınırları |

### 4 Katman ve Sorumlulukları

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   API KATMANI (En dış)                                      │
│   ═══════════════════                                       │
│   Ne yapar:                                                 │
│   • HTTP isteklerini karşılar (Controller)                  │
│   • Kimlik doğrulama/yetkilendirme                          │
│   • Uygulama bootstrap (Program.cs)                         │
│   • Exception → HTTP status code dönüşümü                   │
│                                                             │
│   Ne YAPMAZ:                                                │
│   • İş mantığı (hesaplama, kural kontrolü)                  │
│   • Veritabanı sorgusu                                      │
│                                                             │
│   Bağımlı: Application, Infrastructure                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   APPLICATION KATMANI                                       │
│   ═══════════════════                                       │
│   Ne yapar:                                                 │
│   • İş kurallarını uygular (Service)                        │
│   • Veri doğrulama (Validation)                             │
│   • Entity ↔ DTO dönüşümü                                  │
│   • Repository ve servis interface'lerini tanımlar          │
│                                                             │
│   Ne YAPMAZ:                                                │
│   • Veritabanı sorgusu (EF Core bilmez!)                    │
│   • HTTP bilgisi (Request, Response bilmez)                  │
│                                                             │
│   Bağımlı: Sadece Domain                                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   INFRASTRUCTURE KATMANI                                    │
│   ══════════════════════                                     │
│   Ne yapar:                                                 │
│   • Veritabanı erişimi (Repository implementasyonları)      │
│   • EF Core DbContext ve konfigürasyonları                  │
│   • Dış servisler (JWT token üretimi)                       │
│   • Application'daki interface'leri gerçekleştirir          │
│                                                             │
│   Ne YAPMAZ:                                                │
│   • İş kuralları                                            │
│   • HTTP bilgisi                                            │
│                                                             │
│   Bağımlı: Application, Domain                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   DOMAIN KATMANI (En iç — Çekirdek)                         │
│   ═══════════════════════════════════                        │
│   Ne yapar:                                                 │
│   • Entity'leri tanımlar (veri modeli)                       │
│   • Enum'ları tanımlar (sabit değerler)                     │
│   • Value Object'leri tanımlar                              │
│                                                             │
│   Ne YAPMAZ:                                                │
│   • HİÇBİR DIŞ BAĞIMLILIK! Framework, DB, HTTP bilmez     │
│                                                             │
│   Bağımlı: HİÇBİR ŞEY                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Bağımlılık Yönü — Somut Örnek

Diyelim ki `SwipeService` bir swipe kaydetmek istiyor. Nasıl çalışır?

```
SwipeController (API)
    │
    │  "Hey SwipeService, bu swipe'ı kaydet"
    ▼
ISwipeService interface (Application'da tanımlı)
    │
    │  SwipeService bu interface'i implemente eder
    ▼
SwipeService (Application)
    │
    │  "Hey repository, bu kaydı veritabanına yaz"
    ▼
ISwipeRepository interface (Application'da tanımlı)
    │
    │  SwipeRepository bu interface'i implemente eder
    ▼
SwipeRepository (Infrastructure)
    │
    │  EF Core ile veritabanına yazar
    ▼
SQLite Veritabanı
```

**Kritik nokta**: `SwipeService` asla `SwipeRepository`'yi doğrudan bilmez. `ISwipeRepository` interface'ine bağımlıdır. Yarın PostgreSQL'e geçsen, yeni bir `PostgresSwipeRepository` yazarsın ve DI kaydını değiştirirsin — `SwipeService`'e dokunmazsın.

### Proje Referans Zinciri (.csproj dosyaları)

```
EvArkadasimV2.API.csproj
├── → EvArkadasimV2.Application.csproj
│       └── → EvArkadasimV2.Domain.csproj
└── → EvArkadasimV2.Infrastructure.csproj
        ├── → EvArkadasimV2.Application.csproj
        └── → EvArkadasimV2.Domain.csproj
```

**Dikkat**: Application, Infrastructure'ı referans ALMAZ. Bu sayede Application katmanı EF Core'u bilmez.

---

## 4. Dependency Injection (Bağımlılık Enjeksiyonu) — Detaylı

### DI Nedir?

Normalde bir sınıfın ihtiyaç duyduğu bağımlılığı kendisi oluşturur:

```csharp
// ❌ KÖTÜ: Sıkı bağımlılık (tight coupling)
public class SwipeService
{
    private readonly SwipeRepository _repo = new SwipeRepository(new AppDbContext());
    // SwipeRepository değişirse SwipeService de değişmeli
    // Test yazarken gerçek veritabanı gerekir
}
```

DI ile bağımlılık dışarıdan verilir:

```csharp
// ✅ İYİ: Gevşek bağımlılık (loose coupling)
public class SwipeService
{
    private readonly ISwipeRepository _repo;
    
    public SwipeService(ISwipeRepository repo)  // Constructor'dan al
    {
        _repo = repo;
    }
    // ISwipeRepository'nin arkasında ne olduğunu bilmez ve umursamaz
    // Test: FakeSwipeRepository verebilirsin
}
```

### Lifetime (Yaşam Süresi) Karşılaştırması

Program.cs'teki `AddScoped` ne anlama geliyor?

| Lifetime | Kayıt | Davranış | Kullanım |
|----------|-------|----------|----------|
| **Scoped** | `AddScoped<>()` | Her HTTP isteği için 1 instance. Aynı istek içinde paylaşılır | **DbContext, Repository, Service** — Aynı istek içindeki tüm servisler aynı DbContext'i kullanır → tek transaction |
| **Transient** | `AddTransient<>()` | Her istendiğinde yeni instance | Hafif, durum tutmayan yardımcı sınıflar |
| **Singleton** | `AddSingleton<>()` | Uygulama boyunca 1 instance | Cache, konfigürasyon, HttpClient |

**Neden Scoped?**

```
HTTP İsteği #1                    HTTP İsteği #2
┌─────────────────────┐          ┌─────────────────────┐
│ SwipeService ──┐    │          │ SwipeService ──┐    │
│                │    │          │                │    │
│ MatchRepository┼──▶ DbContext₁│  FeedService ──┼──▶ DbContext₂
│                │    │          │                │    │
│ UserRepository─┘    │          │ UserRepository─┘    │
└─────────────────────┘          └─────────────────────┘
   Aynı DbContext paylaşılır       Farklı DbContext
   → Tek transaction               → Bağımsız
```

Eğer `AddSingleton` kullansaydık, tüm istekler aynı DbContext'i paylaşırdı → thread-safety sorunu, veri sızıntısı.

### Bu Projedeki DI Kayıtları

```csharp
// Repository'ler (veritabanı erişimi)
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ISwipeRepository, SwipeRepository>();
builder.Services.AddScoped<IMatchRepository, MatchRepository>();
builder.Services.AddScoped<IPropertyRepository, PropertyRepository>();
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
// ↑ Open generic: IGenericRepository<Property> istenirse GenericRepository<Property> verilir

// Servisler (iş mantığı)
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<ITestService, TestService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISwipeService, SwipeService>();
builder.Services.AddScoped<IFeedService, FeedService>();
builder.Services.AddScoped<ICompatibilityService, CompatibilityService>();
builder.Services.AddScoped<IPropertyService, PropertyService>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();
builder.Services.AddScoped<IMessageService, MessageService>();
```

**Nasıl çalışır?** DI container şöyle düşünür:
1. `SwipeController`'ın constructor'ı `ISwipeService` istiyor
2. `ISwipeService` → `SwipeService` olarak kayıtlı, onu oluşturayım
3. Ama `SwipeService`'in constructor'ı `ISwipeRepository`, `IMatchRepository`, `IUserRepository`, `ICompatibilityService` istiyor
4. Bunların da kayıtlarını bulup oluşturayım
5. Hepsini zincirleme inject edeyim

Bu otomatik zincirleme "dependency resolution" olarak bilinir.

---

## 5. Konfigürasyon

### appsettings.json — Detaylı Açıklama

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=evarkadasimv2.db"
    // SQLite bağlantı dizesi. "Data Source" = dosya yolu.
    // Göreceli yol: API projesinin çalışma dizininde oluşur.
    // Üretimde: "Data Source=/var/data/evarkadasimv2.db" gibi mutlak yol
    // veya PostgreSQL: "Host=localhost;Database=evarkadasim;Username=app;Password=..."
  },
  "JwtSettings": {
    "Secret": "REPLACE_WITH_SECURE_SECRET_VIA_ENV_OR_USER_SECRETS",
    // JWT token'ı imzalamak için kullanılan gizli anahtar.
    // ÖNEMLİ: Bu değer koda yazılmamalı! Environment variable'dan okunmalı.
    // Minimum 32 karakter (256 bit) olmalı — HMAC-SHA256 algoritması için.
    
    "Issuer": "EvArkadasimV2API",
    // Token'ı kim oluşturdu? Doğrulama sırasında kontrol edilir.
    // Yanlış issuer'lı token'lar reddedilir.
    
    "Audience": "EvArkadasimV2MobileApp",
    // Token kimin için oluşturuldu? Doğrulama sırasında kontrol edilir.
    // Farklı audience'a sahip token'lar reddedilir.
    
    "ExpiryInMinutes": 1440
    // 1440 dakika = 24 saat. Token bu süre sonunda geçersiz olur.
    // Kısa süre = daha güvenli ama kullanıcı sık login yapar.
    // Uzun süre = kullanıcı rahat ama çalınan token uzun süre geçerli kalır.
    // İdeal: 15-30dk access token + refresh token mekanizması.
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      // Tüm kategoriler için minimum log seviyesi.
      
      "Microsoft.AspNetCore": "Warning",
      // Framework logları çok gürültülü olabilir, sadece uyarı ve üstü göster.
      
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
      // EF Core'un ürettiği SQL sorgularını görmek için.
      // Debug sırasında çok faydalı: hangi SQL çalıştığını görürsün.
      // Üretimde "Warning" yapılmalı — performans etkisi var.
    }
  },
  "AllowedHosts": "*"
  // Hangi host adlarından gelen isteklere izin verilir.
  // "*" = hepsine izin ver. Üretimde "evarkadasim.com" gibi kısıtlanmalı.
}
```

### appsettings.Development.json — Override Mekanizması

```json
{
  "JwtSettings": {
    "Secret": "EvArkadasimV2-Dev-Secret-Key-MinimumThirtyTwoCharactersLong-2026"
  }
}
```

ASP.NET Core konfigürasyon sistemi katmanlı çalışır:
1. `appsettings.json` yüklenir (base)
2. `appsettings.{Environment}.json` yüklenir (override)
3. Environment variables yüklenir (en yüksek öncelik)

Development ortamında `Secret` değeri bu dosyadan gelir. Üretimde environment variable'dan gelir.

### Options Pattern — JwtSettings Sınıfı

```csharp
// Application/Options/JwtSettings.cs
public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiryInMinutes { get; set; }
}

// Program.cs'te bağlama:
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
// Bu satır, appsettings.json'daki "JwtSettings" bölümünü JwtSettings sınıfına map'ler.

// TokenService'te kullanım:
public TokenService(IOptions<JwtSettings> jwtOptions)
{
    _jwtSettings = jwtOptions.Value;  // Artık _jwtSettings.Secret ile erişim
}
```

**Neden `IConfiguration` yerine Options Pattern?**

```csharp
// ❌ KÖTÜ: Magic string + tip güvensizliği
var secret = _configuration["JwtSettings:Secret"];  // string? dönüyor, null olabilir
var expiry = int.Parse(_configuration["JwtSettings:ExpiryInMinutes"]!);  // Parse hatası?

// ✅ İYİ: Tip güvenli + IDE desteği
var secret = _jwtSettings.Secret;      // string, IDE autocomplete
var expiry = _jwtSettings.ExpiryInMinutes;  // int, parse hatası imkansız
```

---

## 6. Middleware Pipeline — İstek Yaşam Döngüsü

Bir HTTP isteği sunucuya ulaştığında şu aşamalardan geçer:

```
Client İsteği: POST /api/swipe { "receiverId": "abc", "swipeType": "Like" }
    │
    ▼
┌─ UseHttpsRedirection() ─────────────────────────────────────────────┐
│  HTTP isteği gelirse HTTPS'e yönlendir (301 redirect)               │
│  Neden: Şifrelenmemiş HTTP trafiğinde token çalınabilir (MITM)     │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─ UseCors("Development") ────────────────────────────────────────────┐
│  Cross-Origin isteklere izin ver                                     │
│  Dev: AllowAnyOrigin (localhost:3000'den gelen istekler çalışsın)    │
│  Prod: WithOrigins("https://evarkadasim.com") (sadece kendi domain) │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─ UseAuthentication() ───────────────────────────────────────────────┐
│  Authorization header'daki JWT token'ı doğrula                      │
│  Token geçerliyse → HttpContext.User'a claim'leri yaz               │
│  Token yoksa veya geçersizse → User boş kalır                       │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─ UseAuthorization() ────────────────────────────────────────────────┐
│  [Authorize] attribute'u olan controller/action'ları kontrol et     │
│  User boşsa (token yoksa) → 401 Unauthorized döndür                │
│  User doluysa → devam et                                            │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─ MapControllers() ──────────────────────────────────────────────────┐
│  URL'yi doğru Controller + Action ile eşleştir                      │
│  POST /api/swipe → SwipeController.Swipe()                          │
│  Model binding: JSON body → SwipeRequestDto                         │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
Controller → Service → Repository → Database
    │
    ▼
Yanıt: 200 OK { "isMatch": true, "matchedUserId": "xyz" }
```

**Sıra neden önemli?** `UseAuthentication()` → `UseAuthorization()` sırasını tersine çevirirsen, Authorization middleware henüz kimlik doğrulanmamış bir kullanıcıyı görür ve her isteği reddeder.
