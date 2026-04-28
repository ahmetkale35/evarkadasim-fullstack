# EvArkadasimV2 — Kod Analizi (Eğitim Amaçlı) — Part 2

> **Bu belge ne?** Infrastructure ve API katmanlarının satır satır açıklaması + projeden öğrenilecek her kavramın listesi. Part 1 için [ANALIZ-PART1.md](./ANALIZ-PART1.md) dosyasına bakın.

---

## 📦 KATMAN 3: INFRASTRUCTURE (Altyapı)

### 3.1 AppDbContext — Veritabanı Modeli

```csharp
public class AppDbContext : IdentityDbContext<AppUser>
```

**`IdentityDbContext<AppUser>`**: Normal `DbContext` yerine Identity'nin özel DbContext'i kullanılıyor. Bu, `AspNetUsers`, `AspNetRoles`, `AspNetUserClaims` gibi Identity tablolarını otomatik oluşturur.

#### İlişki Konfigürasyonları (Fluent API)

```csharp
// 1:1 İlişki — AppUser ↔ UserProfile
builder.Entity<AppUser>()
    .HasOne(u => u.Profile)
    .WithOne(p => p.AppUser)
    .HasForeignKey<UserProfile>(p => p.AppUserId)
    .OnDelete(DeleteBehavior.Cascade);  // User silinince profil de silinir

// UserSwipe → AppUser
builder.Entity<UserSwipe>()
    .HasOne(s => s.Sender).WithMany()
    .HasForeignKey(s => s.SenderId)
    .OnDelete(DeleteBehavior.Restrict); // User silinemez (swipe varsa)
```

**Cascade vs Restrict**: UserSwipe ve UserMatch'te `Restrict` kullanılıyor. Bir kullanıcı silindiğinde tüm swipe ve match kayıtlarının kaskad silinmesi tehlikelidir — karşı tarafın verileri de etkilenir.

#### JSON Value Conversion

```csharp
entity.Property(e => e.Lifestyle)
    .HasConversion(
        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),      // C# → DB
        v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null) ?? new()
    );
// List<string> → SQLite TEXT sütununda JSON olarak saklanır
// ["Müzik", "Sinema"] ↔ '["Müzik","Sinema"]'
```

---

### 3.2 GenericRepository — Temel CRUD

```csharp
public class GenericRepository<T> : IGenericRepository<T> where T : class
{
    protected readonly AppDbContext _context;   // protected: alt sınıflar erişebilir
    protected readonly DbSet<T> _dbSet;

    public IQueryable<T> GetAll(bool tracking = true)
    {
        var query = _dbSet.AsQueryable();
        if (!tracking)
            query = query.AsNoTracking();  // Read-only: Change Tracker devre dışı
        return query;
    }
    
    public async Task<bool> SaveChangesAsync() 
        => await _context.SaveChangesAsync() > 0;  // Etkilenen satır > 0 ise true
}
```

---

### 3.3 UserRepository — Feed Sorgusu Detayları

```csharp
public async Task<List<(AppUser User, bool HasLikedCurrentUser)>>
    GetFeedCandidatesWithLikeStatusAsync(string currentUserId)
{
    // SORGU 1: Adayları çek
    var candidates = await _context.Users
        .AsNoTracking()                                        // Read-only
        .Include(u => u.Profile)                               // Eager load (N+1 çözümü)
        .Where(u => u.Id != currentUserId)                     // Kendini gösterme
        .Where(u => u.Profile != null)                         // Profili olmayanları eleme
        .Where(u => !_context.UserSwipes                       // Zaten swipe edilenleri eleme
            .Any(s => s.SenderId == currentUserId && s.ReceiverId == u.Id))
        .ToListAsync();

    // SORGU 2: Beni beğenenlerin ID'lerini al
    var likedMeIds = new HashSet<string>(...);  // HashSet: O(1) Contains

    // Birleştir
    return candidates.Select(u => (User: u, HasLikedCurrentUser: likedMeIds.Contains(u.Id))).ToList();
}
```

**Öğrenilecek Teknikler:**

| Teknik | Açıklama |
|--------|----------|
| **Tuple Return** | `(AppUser User, bool HasLikedCurrentUser)` — geçici DTO yaratmadan iki bilgiyi birlikte döndürme |
| **HashSet** | `Contains()` O(1) karmaşıklık. `List` olsaydı O(n) olurdu |
| **Subquery** | `_context.UserSwipes.Any(...)` EF Core tarafından SQL subquery'ye çevrilir |

---

### 3.4 TokenService — JWT Üretimi

```csharp
public (string Token, DateTime Expiration) GenerateToken(AppUser user)
{
    var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id),   // Controller'larda userId çıkarmak için
        new Claim(JwtRegisteredClaimNames.Sub, user.Id), // JWT standardı
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())  // Token ID
    };
    // HMAC-SHA256 ile imzala → Base64 encode → "eyJhbGci..." string
}
```

**Tuple Return**: `(string Token, DateTime Expiration)` — AuthService token ve süreyi birlikte alır. Süre hesabı tek bir yere (TokenService) sınırlanır.

---

### 3.5 DataSeeder — Dikkat Edilecek Noktalar

```csharp
// ❌ HATA: Aynı C# instance'ını iki owned type'a atama
var scores = new BasicTestResults { ... };
profile.InitialBasicTestResults = scores;
profile.FinalScores = scores;  // EF: "principal entity is not known" HATASI!

// ✅ DOĞRU: Her property için ayrı instance
BasicTestResults NewScores() => new BasicTestResults { ... };
profile.InitialBasicTestResults = NewScores();
profile.FinalScores = NewScores();
```

**Owned Type Instance Paylaşım Yasağı**: EF Core'da aynı owned type instance'ını iki farklı navigation property'ye atayamazsın.

---

## 📦 KATMAN 4: API (Sunum)

### 4.1 Program.cs — Bootstrap Satırları

```csharp
// JSON'da enum'ları string olarak serialize et
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
// SwipeType.Like → "Like" (int 1 yerine)

// Scoped: Her HTTP isteği için yeni instance
builder.Services.AddScoped<ISwipeService, SwipeService>();
```

### 4.2 Controller Deseni

```csharp
[Authorize]  // JWT zorunlu
public class SwipeController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Swipe([FromBody] SwipeRequestDto request)
    {
        // Token'dan userId çıkar (body'den DEĞİL — güvenlik)
        var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        
        try {
            var result = await _swipeService.SwipeAsync(senderId, request);
            return Ok(result);
        }
        catch (DomainException ex)   { return BadRequest(new { ex.Message }); }   // 400
        catch (NotFoundException ex) { return NotFound(new { ex.Message }); }     // 404
        catch (Exception ex) {
            _logger.LogError(ex, "...");
            return StatusCode(500, new { Message = "Sunucu hatası." });           // 500
            // Stack trace client'a ASLA gönderilmez
        }
    }
}
```

---

## 🧠 Bu Projeden Öğrenmen Gereken Her Şey

### Mimari Kavramlar
1. **Clean Architecture** — Katmanlı mimari, bağımlılık yönü, sorumluluk ayrımı
2. **Dependency Injection** — `AddScoped`, constructor injection, lifetime yönetimi
3. **Repository Pattern** — Generic repository, domain-specific repository
4. **DTO Pattern** — Entity ↔ DTO dönüşümü, veri gizleme, API sözleşmesi

### C# & .NET Kavramları
5. **Nullable Reference Types** — `string?`, `int?`, null-forgiving `null!`
6. **Generics** — `IGenericRepository<T>`, `where T : class`
7. **Expression Trees** — `Expression<Func<T, bool>>` (LINQ to SQL)
8. **Tuple Return Types** — `(string Token, DateTime Expiration)`
9. **Pattern Matching** — `random.Next(0,4) is var rt && rt == 3`
10. **Options Pattern** — `IOptions<JwtSettings>`, strongly-typed config

### EF Core Kavramları
11. **Fluent API** — İlişki tanımlama, cascade kuralları
12. **Owned Types** — `[Owned]`, ayrı tablo yerine aynı tabloda sütun
13. **Value Conversion** — `HasConversion()`, JSON serialization
14. **Change Tracking** — `AsNoTracking()` performans optimizasyonu
15. **Eager Loading** — `Include()`, `ThenInclude()`, N+1 problemi çözümü
16. **Migration** — `MigrateAsync()`, schema yönetimi

### Güvenlik Kavramları
17. **JWT Authentication** — Token yapısı, claim'ler, imzalama
18. **User Enumeration Protection** — Aynı hata mesajı
19. **Token-based Identity** — Sender ID'yi token'dan çıkarma
20. **CORS Policy** — Development vs Production politikaları
21. **Stack Trace Hiding** — Exception detaylarını client'a sızdırmama

### API Tasarım Kavramları
22. **RESTful Routing** — `[Route("api/[controller]")]`, HTTP verb'leri
23. **Error Handling Hierarchy** — Exception → HTTP status code mapping
24. **Idempotency** — Aynı swipe'ı iki kez atamama
25. **Pagination** — `skip/take`, `MaxTake` DoS koruması
26. **Partial Update** — Nullable DTO alanları ile kısmi güncelleme

### Veri Yapısı ve Algoritma
27. **HashSet Optimizasyonu** — O(1) lookup vs O(n) list search
28. **Composite Sorting** — `OrderByDescending().ThenByDescending()`
29. **Uyumluluk Algoritması** — Manhattan distance tabanlı skor hesaplama
30. **Deterministic Seeding** — `Random(42)` test tutarlılığı
