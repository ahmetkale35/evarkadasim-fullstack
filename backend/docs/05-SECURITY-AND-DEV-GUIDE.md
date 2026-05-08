# Güvenlik, Performans ve Geliştirme Rehberi — Detaylı

## 1. Güvenlik Mimarisi

### 1.1 Kimlik Doğrulama Akışı — Uçtan Uca

```
┌─────────┐                     ┌──────────┐                    ┌──────────┐
│  Client  │                     │   API    │                    │    DB    │
│ (Mobil)  │                     │ (Server) │                    │ (SQLite) │
└────┬─────┘                     └────┬─────┘                    └────┬─────┘
     │                                │                               │
     │ POST /api/auth/login           │                               │
     │ { email, password }            │                               │
     │──────────────────────────────▶│                               │
     │                                │ FindByEmailAsync(email)       │
     │                                │─────────────────────────────▶│
     │                                │◀─────────────────────────────│
     │                                │ user + PasswordHash           │
     │                                │                               │
     │                                │ CheckPasswordAsync(password)  │
     │                                │ (hash karşılaştırma)          │
     │                                │                               │
     │                                │ GenerateToken(user)           │
     │                                │ → JWT oluştur + imzala        │
     │                                │                               │
     │ 200 OK                         │                               │
     │ { token, expiration, userId }  │                               │
     │◀──────────────────────────────│                               │
     │                                │                               │
     │ GET /api/profile               │                               │
     │ Authorization: Bearer eyJhb... │                               │
     │──────────────────────────────▶│                               │
     │                                │ UseAuthentication()           │
     │                                │ → Token doğrula (imza, süre)  │
     │                                │ → Claims'i HttpContext'e yaz   │
     │                                │                               │
     │                                │ UseAuthorization()            │
     │                                │ → [Authorize] kontrolü         │
     │                                │                               │
     │                                │ Controller: userId çıkar      │
     │                                │ → Service → Repository → DB   │
     │                                │                               │
     │ 200 OK { profile data }        │                               │
     │◀──────────────────────────────│                               │
```

### 1.2 Uygulanan Güvenlik Önlemleri — Detaylı

#### Şifre Güvenliği

```csharp
// Program.cs — Identity Password Policy
options.Password.RequireDigit = true;           // En az 1 rakam
options.Password.RequiredLength = 8;            // Minimum 8 karakter
options.Password.RequireNonAlphanumeric = true; // En az 1 özel karakter (!@#$%...)
options.Password.RequireUppercase = true;        // En az 1 büyük harf
options.Password.RequireLowercase = true;        // En az 1 küçük harf
```

**Ne öğrenmelisin**: Şifreler ASLA düz metin saklanmaz. Identity şu işlemi yapar:
```
"Test1234!" → PBKDF2 (Password-Based Key Derivation Function 2)
           → 10000 iterasyon + rastgele 128-bit salt
           → "AQAAAAEAACcQAAAAEK3..." gibi hash string
```
Aynı şifre bile her seferinde farklı hash üretir (farklı salt). Veritabanı çalınsa bile şifreler kırılamaz.

#### Sender Kimliği Token'dan Çıkarma

```csharp
// SwipeController.cs
var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
// ↑ Token'daki claim'den userId alınır.
// Request body'den ALINMAZ!
```

**Neden?** Kötü niyetli kullanıcı body'de başkasının ID'sini gönderebilir:
```json
// ❌ Saldırı: Ahmet'in token'ı ile ama Mehmet'in ID'sini gönder
POST /api/swipe
Authorization: Bearer <ahmet_token>
{ "senderId": "mehmet_id", "receiverId": "zeynep_id", "swipeType": "Like" }
```
Sender'ı token'dan çıkardığımız için bu saldırı imkansız.

#### Kaynak Sahibi Doğrulaması (IDOR Koruması)

`PropertyService`'deki Update ve Delete işlemlerinde uygulandı:

```csharp
// Token'dan gelen kullanıcı ID'si
var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

var property = await _propertyRepository.GetByIdAsync(id);

// KRİTİK GÜVENLİK KONTROLÜ
if (property.OwnerId != currentUserId)
    throw new DomainException("Bu ilanı düzenleme yetkiniz yok.");
```

**Neden?** Sadece `[Authorize]` kullanmak yetmez. `[Authorize]` kullanıcının sisteme giriş yaptığını garanti eder, ancak başkasının ilanını güncelleyemeyeceğini garanti etmez. **Insecure Direct Object Reference (IDOR)** güvenlik zafiyetini engellemek için, kaynağa erişirken "Bu kaynağın sahibi, isteği atan kişi mi?" kontrolü yapılmalıdır.

#### Exception'larda Bilgi Sızıntısı Engelleme

```csharp
// Controller'larda:
catch (Exception ex)
{
    // ❌ KÖTÜ (asla yapma):
    // return StatusCode(500, new { ex.Message, ex.StackTrace, ex.InnerException });
    // Saldırgan: tablo adları, sütun adları, sorgu yapısı, dosya yolları öğrenir!
    
    // ✅ İYİ:
    _logger.LogError(ex, "Swipe sırasında hata. SenderId: {SenderId}", senderId);
    return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
    // Detaylar sadece sunucu logunda. Client genel mesaj görür.
}
```

#### CORS (Cross-Origin Resource Sharing)

```csharp
// Development: Her yerden istek kabul et
policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
// Neden? localhost:3000 (React), localhost:8081 (Expo), emülatör farklı origin'ler.

// Production: Sadece kendi domain'inden kabul et
policy.WithOrigins("https://evarkadasim.com").AllowAnyMethod().AllowAnyHeader();
// Neden? Başka siteler bizim API'mize istek atamamalı (CSRF koruması).
```

---

## 2. Performans — Detaylı

### 2.1 AsNoTracking — Change Tracker Optimizasyonu

EF Core varsayılan olarak sorgudan dönen her entity'yi "Change Tracker"a kaydeder. Bu sayede:
- `user.Name = "Yeni Ad"` yapınca EF değişikliği algılar
- `SaveChanges()` çağrılınca otomatik UPDATE üretir

**Ama read-only sorgularda bu gereksiz**:

```csharp
// ❌ Tracking açık (varsayılan): Belleğe yükle + Change Tracker'a kaydet
var users = await _context.Users.ToListAsync();
// 50 kullanıcı × ~1KB entity = ~50KB bellek
// + Change Tracker overhead: ~50KB daha = ~100KB toplam
// + Her property için snapshot (değişiklik algılama)

// ✅ Tracking kapalı: Sadece belleğe yükle
var users = await _context.Users.AsNoTracking().ToListAsync();
// 50 kullanıcı × ~1KB entity = ~50KB bellek
// Change Tracker yükü YOK
// %40-50 daha az bellek, %20-30 daha hızlı sorgu
```

**Bu projede kural**: Okuma → `tracking: false`, Yazma → `tracking: true`

### 2.2 Eager Loading — N+1 Problemi Çözümü

**N+1 Problemi Nedir?**

```csharp
// ❌ KÖTÜ: N+1 sorgu
var matches = await _context.UserMatches.ToListAsync();  // 1 sorgu: 10 match
foreach (var m in matches)
{
    Console.WriteLine(m.User1.Name);  // Her biri için 1 sorgu → 10 sorgu
    Console.WriteLine(m.User2.Name);  // Her biri için 1 sorgu → 10 sorgu
}
// Toplam: 1 + 10 + 10 = 21 sorgu! 😱

// ✅ İYİ: Eager loading ile 1 sorgu
var matches = await _context.UserMatches
    .Include(m => m.User1)   // JOIN ile birlikte çek
    .Include(m => m.User2)   // JOIN ile birlikte çek
    .ToListAsync();
// Toplam: 1 sorgu (SQL JOIN ile) 🚀
```

**Bu projede kullanım yerleri:**
- `UserRepository.GetUserWithProfileAsync` → `Include(u => u.Profile)`
- `MatchRepository.GetMatchesForUserAsync` → `Include(m => m.User1).ThenInclude(u => u.Profile)`

### 2.3 HashSet Optimizasyonu

```csharp
// UserRepository.GetFeedCandidatesWithLikeStatusAsync
var likedMeIds = new HashSet<string>(await _context.UserSwipes
    .Where(s => s.ReceiverId == currentUserId && ...)
    .Select(s => s.SenderId)
    .ToListAsync());

// Sonra her aday için kontrol:
likedMeIds.Contains(userId)  // O(1) — sabit süre, veri boyutundan bağımsız
```

`List<string>` kullansaydık: `Contains()` O(n) — her eleman taranır.
1000 aday × 100 beğeni = 100,000 karşılaştırma.
`HashSet` ile: 1000 aday × 1 hash lookup = 1000 işlem.

---

## 3. Controller Deseni — Global Exception Handler

Tüm controller'lardaki try-catch blokları `GlobalExceptionMiddleware` ile merkezileştirildi. Controller'lar sadece HTTP şeklini yönetir, hata yönetimi middleware'e bırakılır.

### Middleware Yapısı

```csharp
public class GlobalExceptionMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AppException ex)
        {
            // Beklenen uygulama hatası: iş kuralı ihlali, kaynak yok, yetkisiz erişim.
            // Stack trace loglamaya gerek yok — "normal" iş akışı sonucu.
            _logger.LogWarning("Uygulama hatası: {StatusCode} - {Message}", ex.StatusCode, ex.Message);
            await WriteErrorAsync(context, ex.StatusCode, ex.Message);
        }
        catch (Exception ex)
        {
            // Beklenmedik sistem hatası: NullReference, DbException, vs.
            // Stack trace'i logla, ama client'a verme.
            _logger.LogError(ex, "Beklenmedik hata: {Path}", context.Request.Path);
            await WriteErrorAsync(context, 500, "Sunucu hatası oluştu.");
        }
    }
}
```

### Exception Hiyerarşisi

```
Exception (System)
└── AppException (soyut base class — StatusCode taşır)
    ├── DomainException (400) — İş kuralı ihlali
    ├── UnauthorizedException (401) — Kimlik doğrulama başarısız
    ├── ForbiddenException (403) — Yetkisiz erişim
    └── NotFoundException (404) — Kaynak bulunamadı
```

Controller örneği (temiz, try-catch yok):

```csharp
[HttpPost]
public async Task<IActionResult> Swipe([FromBody] SwipeRequestDto request)
{
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var result = await _swipeService.SwipeAsync(userId, request);
    return Ok(result);
    // Exception fırlarsa GlobalExceptionMiddleware yakalar.
}
```

### Token Revocation Middleware

`TokenRevocationMiddleware`, authentication sonrası ve authorization öncesinde çalışır:

```csharp
public async Task InvokeAsync(HttpContext context, ITokenService tokenService)
{
    if (context.User.Identity?.IsAuthenticated == true)
    {
        var jti = context.User.FindFirstValue(JwtRegisteredClaimNames.Jti);
        if (jti != null && await tokenService.IsAccessTokenRevokedAsync(jti))
        {
            context.Response.StatusCode = 401;
            return; // Pipeline'a devam etme
        }
    }
    await _next(context);
}
```

Logout sırasında access token'ın `jti` claim'i in-memory blocklist'e eklenir. Token süresi dolana kadar bu middleware tarafından reddedilir — veritabanına gitmeden.

### Rate Limiting

IP-bazlı hız sınırlama `AspNetCoreRateLimit` kütüphanesiyle uygulanır. Kurallar `appsettings.json`'da:

| Endpoint | Limit | Süre |
|----------|-------|------|
| `POST /api/auth/login` | 10 istek | 1 dakika |
| `POST /api/auth/register` | 5 istek | 1 saat |
| Genel (`*`) | 100 istek | 1 dakika |

Development ortamında devre dışı bırakılır (Postman testlerini bloklamasın). Production'da `UseIpRateLimiting()` pipeline'a eklenir.

---

## 4. Geliştirme Rehberi

### Yeni Bir Özellik Eklemek — Adım Adım Örnek

Diyelim ki **"Kullanıcı Engelleme"** özelliği eklemek istiyorsun:

**1. Domain — Entity:**
```csharp
// Domain/Entities/UserBlock.cs
public class UserBlock
{
    public int Id { get; set; }
    public string BlockerId { get; set; }       // Engelleyen
    public AppUser Blocker { get; set; }
    public string BlockedUserId { get; set; }   // Engellenen
    public AppUser BlockedUser { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

**2. Infrastructure — DbContext:**
```csharp
// AppDbContext.cs
public DbSet<UserBlock> UserBlocks { get; set; }

// OnModelCreating:
builder.Entity<UserBlock>()
    .HasOne(b => b.Blocker).WithMany()
    .HasForeignKey(b => b.BlockerId).OnDelete(DeleteBehavior.Restrict);
```

**3. Application — DTO:**
```csharp
// Application/DTOs/User/BlockUserDto.cs
public class BlockUserDto
{
    public string UserId { get; set; }
}
```

**4. Application — Interface:**
```csharp
// Application/Interfaces/Services/IBlockService.cs
public interface IBlockService
{
    Task<bool> BlockUserAsync(string blockerId, string blockedUserId);
}
```

**5. Application — Service:**
```csharp
// Application/Services/BlockService.cs
public class BlockService : IBlockService { ... }
```

**6. Infrastructure — Repository (gerekirse):**
```csharp
// Basit CRUD ise GenericRepository yeterli, özel sorgu gerekirse:
// IBlockRepository + BlockRepository
```

**7. API — Controller:**
```csharp
// API/Controllers/BlockController.cs
[HttpPost]
public async Task<IActionResult> BlockUser([FromBody] BlockUserDto dto) { ... }
```

**8. Program.cs — DI Kaydı:**
```csharp
builder.Services.AddScoped<IBlockService, BlockService>();
```

**9. Migration:**
```bash
dotnet ef migrations add AddUserBlocks ...
```

### Paket Bağımlılıkları Tablosu

#### Domain Katmanı

| Paket | Neden? |
|-------|--------|
| Microsoft.AspNetCore.Identity.EntityFrameworkCore | `IdentityUser` sınıfı — AppUser'ın base class'ı |
| Microsoft.EntityFrameworkCore | `[Owned]`, `[NotMapped]` attribute'ları |
| System.IdentityModel.Tokens.Jwt | JWT claim tipleri (Value Object'lerde kullanılabilir) |

#### Application Katmanı

| Paket | Neden? |
|-------|--------|
| *(Sadece Domain referansı)* | **Framework bağımsızlığı** — EF Core, HTTP, JWT bilmez |

> Bu bilinçli bir karar: Application katmanı sadece Domain'e bağımlı. Veritabanı değişse (SQL → MongoDB), HTTP framework değişse (ASP.NET → gRPC) — Application katmanına dokunmazsın.

#### Infrastructure Katmanı

| Paket | Neden? |
|-------|--------|
| Microsoft.EntityFrameworkCore | ORM — C# ile SQL yazmadan DB işlemleri |
| Microsoft.EntityFrameworkCore.Sqlite | SQLite database provider |
| Microsoft.EntityFrameworkCore.Tools | `dotnet ef migrations` CLI komutları |
| Microsoft.AspNetCore.Identity.EntityFrameworkCore | Identity tablolarını EF Core ile yönet |

#### API Katmanı

| Paket | Neden? |
|-------|--------|
| Microsoft.AspNetCore.Authentication.JwtBearer | JWT token doğrulama middleware'i |
| Microsoft.EntityFrameworkCore.Design | Migration oluşturma desteği (design-time) |
| Swashbuckle.AspNetCore | Swagger UI — interaktif API dokümantasyonu |
| System.IdentityModel.Tokens.Jwt | Token oluşturma ve claim yönetimi |
| Serilog.AspNetCore | Structured logging + request logging middleware |
| AspNetCoreRateLimit | IP-bazlı hız sınırlama |
| StackExchange.Redis | Redis distributed cache bağlantısı |

---

## 5. Özellik Durumu ve Yol Haritası

### Tamamlanan Özellikler

| Özellik | Durum | Notlar |
|---------|-------|--------|
| **Auth (JWT + Refresh Token)** | ✅ Tamamlandı | Register, Login, Refresh, Logout + token revocation |
| **Profil Yönetimi** | ✅ Tamamlandı | GET/PUT, kısmi güncelleme |
| **Kişilik Testi** | ✅ Tamamlandı | Temel (6 boyut) + Detaylı (ortalama) |
| **Feed & Swipe** | ✅ Tamamlandı | Uyumluluk sıralaması, Like/Pass/SuperLike, match detection |
| **Feed Sayfalama** | ✅ Tamamlandı | `skip/take` + `PagedFeedDto`, DoS clamp (max 50) |
| **Mesajlaşma REST** | ✅ Tamamlandı | GET (sayfalı) / POST / MarkAsRead, match membership guard |
| **Real-time (SignalR)** | ✅ Tamamlandı | WebSocket hub, ReceiveMessage + MatchCreated event'leri |
| **Property CRUD** | ✅ Tamamlandı | Filtrelenebilir liste, owner yetkilendirmesi, DataAnnotations |
| **Global Exception Handler** | ✅ Tamamlandı | `GlobalExceptionMiddleware` + `AppException` hiyerarşisi |
| **Token Revocation** | ✅ Tamamlandı | Logout sonrası jti blocklist + `TokenRevocationMiddleware` |
| **Rate Limiting** | ✅ Tamamlandı | IP-bazlı, login/register/genel kurallar |
| **Redis Cache** | ✅ Tamamlandı | Feed sonuçları 5-dk TTL, fault-tolerant (Redis yoksa DB'ye düşer) |
| **Structured Logging** | ✅ Tamamlandı | Serilog, console + rolling file (7 gün), request logging |
| **Health Check** | ✅ Tamamlandı | `GET /health` liveness endpoint |
| **HSTS** | ✅ Tamamlandı | Production'da UseHsts() aktif |
| **CORS (ortam bazlı)** | ✅ Tamamlandı | Dev: AllowAnyOrigin, Prod: appsettings'ten AllowedOrigins |
| **Şehir Filtreleme** | ✅ Tamamlandı | Feed şehir bazında filtreleme, harita pin filtreleme |
| **Rol Filtreleme** | ✅ Tamamlandı | Ev sahibi → sadece ev arayanları görür |
| **Property Map** | ✅ Tamamlandı | Koordinat bazlı harita pinleri (`GET /api/property/map`) |
| **Property Mine** | ✅ Tamamlandı | Kendi ilanını görüntuleme/silme (`GET/DELETE /api/property/mine`) |
| **User Detail** | ✅ Tamamlandı | Tekil kullanıcı profili + uyumluluk skoru (`GET /api/users/{id}`) |
| **Frontend Bağlama** | ✅ Tamamlandı | Mock'tan gerçek API'ye geçiş (Faz 6) — Expo React Native |
| **Unit Tests** | ✅ Tamamlandı | 49 test — xUnit + Moq (6 servis sınıfı) |
| **Seed Verisi** | ✅ Tamamlandı | 50 kullanıcı, 10 ilan, 3 match, 18 mesaj |

### Devam Eden / Planlanan Özellikler

| Özellik | Durum | Zorluk | Etki |
|---------|-------|--------|------|
| **Fotoğraf Upload** | Planlandı | Orta | Gerçek dosya depolama (Azure Blob / S3) |
| **Email Doğrulama** | Planlandı | Orta | Sahte hesap engelleme |
| **Push Notification** | Planlandı | Yüksek | Eşleşme/mesaj bildirimi (FCM/APNs) |
| **API Versioning** | Planlandı | Düşük | Geriye dönük uyumluluk |
| **Kullanıcı Engelleme** | Planlandı | Orta | Feed ve mesajlaşmada filtreleme |
| **Bildirim Tercihleri** | Alan var, logic yok | Düşük | Kullanıcı bildirim ayarları |
| **Soft Delete** | Planlandı | Düşük | Property/User için |
| **Audit Log** | Planlandı | Orta | Kullanıcı aksiyonları takibi |
