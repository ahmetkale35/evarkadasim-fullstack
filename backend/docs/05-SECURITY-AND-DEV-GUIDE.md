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

## 3. Controller Deseni — Try-Catch-Log Kalıbı

Tüm controller'lar aynı yapıyı izler. Bu tekrarlanan bir kalıptır ve gelecekte **middleware** ile merkezileştirilebilir.

### Mevcut Yaklaşım (Her Controller'da)

```csharp
[HttpPost]
public async Task<IActionResult> Swipe([FromBody] SwipeRequestDto request)
{
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    try
    {
        var result = await _swipeService.SwipeAsync(userId, request);
        return Ok(result);                                          // 200
    }
    catch (DomainException ex)   { return BadRequest(new { ex.Message }); }   // 400
    catch (NotFoundException ex) { return NotFound(new { ex.Message }); }     // 404
    catch (Exception ex)
    {
        _logger.LogError(ex, "Hata oluştu. UserId: {UserId}", userId);
        return StatusCode(500, new { Message = "Sunucu hatası oluştu." });    // 500
    }
}
```

### İyileştirme Önerisi: Global Exception Handler Middleware

```csharp
// Gelecekte eklenebilir:
public class ExceptionMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (DomainException ex)
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new { ex.Message });
        }
        catch (NotFoundException ex)
        {
            context.Response.StatusCode = 404;
            await context.Response.WriteAsJsonAsync(new { ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Beklenmedik hata");
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new { Message = "Sunucu hatası." });
        }
    }
}
// Bu sayede controller'lardaki try-catch blokları kaldırılır. Tek yerde yönetim.
```

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

---

## 5. Özellik Durumu ve Yol Haritası

### Tamamlanan Özellikler

| Özellik | Durum | Notlar |
|---------|-------|--------|
| **Auth (JWT)** | ✅ Tamamlandı | Register, Login, token doğrulama |
| **Profil Yönetimi** | ✅ Tamamlandı | GET/PUT, kısmi güncelleme |
| **Kişilik Testi** | ✅ Tamamlandı | Temel (6 boyut) + Detaylı (ortalama) |
| **Feed & Swipe** | ✅ Tamamlandı | Uyumluluk sıralaması, Like/Pass/SuperLike, match detection |
| **Feed Sayfalama** | ✅ Tamamlandı | `skip/take` + `PagedFeedDto`, DoS clamp (max 50) |
| **Mesajlaşma REST** | ✅ Tamamlandı | GET (sayfalı) / POST / MarkAsRead, match membership guard |
| **Property CRUD** | ✅ Tamamlandı | Filtrelenebilir liste, owner yetkilendirmesi, DataAnnotations validation |
| **Unit Tests** | ✅ Tamamlandı | 23 test — xUnit + Moq (CompatibilityService, FeedService, SwipeService) |
| **Seed Verisi** | ✅ Tamamlandı | 50 kullanıcı, 10 ilan, 3 match, 18 mesaj |

### Devam Eden / Planlanan Özellikler

| Özellik | Durum | Zorluk | Etki |
|---------|-------|--------|------|
| **Global Exception Handler** | Planlandı | Düşük | Controller'lardaki try-catch tekrarını kaldır |
| **Mesajlaşma (SignalR / WebSocket)** | Planlandı | Yüksek | Gerçek zamanlı bildirim — REST API'nin üzerine eklenir |
| **Fotoğraf Upload** | Planlandı | Orta | Gerçek dosya depolama (Azure Blob / S3) |
| **Refresh Token** | Planlandı | Orta | Süre dolan token yenileme — şu an 24 saatlik token var |
| **Rate Limiting** | Planlandı | Düşük | Brute-force ve DoS koruması |
| **Email Doğrulama** | Planlandı | Orta | Sahte hesap engelleme |
| **Push Notification** | Planlandı | Yüksek | Eşleşme/mesaj bildirimi (FCM/APNs) |
| **Caching (Redis)** | Planlandı | Orta | Feed ve profil performansı |
| **Logging (Serilog)** | Temel ILogger | Düşük | Structured logging, dosya/DB log |
| **Health Check** | Planlandı | Düşük | Deployment izleme |
| **API Versioning** | Planlandı | Düşük | Geriye dönük uyumluluk |
| **Kullanıcı Engelleme** | Planlandı | Orta | Feed ve mesajlaşmada filtreleme |
| **Bildirim Tercihleri** | Alan var, logic yok | Düşük | Kullanıcı bildirim ayarları |
