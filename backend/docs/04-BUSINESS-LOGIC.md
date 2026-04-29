# İş Mantığı ve Algoritmalar — Detaylı

## 1. Kimlik Doğrulama Sistemi

### Kayıt Akışı (RegisterAsync) — Her Satır Ne Yapar?

```csharp
public async Task<AuthResponseDto> RegisterAsync(RegisterDto request)
{
    // ADIM 1: E-posta benzersizlik kontrolü
    // Identity'nin FindByEmailAsync metodu NormalizedEmail sütununda arar.
    // Normalization: "Ahmet@Example.COM" → "AHMET@EXAMPLE.COM" — büyük/küçük harf farkı yok.
    var existingUser = await _userManager.FindByEmailAsync(request.Email);
    if (existingUser != null)
        throw new DomainException("Bu e-posta adresi zaten kullanımda.");

    // ADIM 2: Kullanıcı + Profil nesnesi oluştur
    var user = new AppUser
    {
        UserName = request.Email,    // Identity UserName'i zorunlu kılar, e-postayı kullanıyoruz
        Email = request.Email,
        Name = request.Name,
        Profile = new UserProfile()  // Boş profil — cascade insert ile otomatik eklenir
        // ↑ EF Core "cascade insert" davranışı:
        //   user INSERT edildiğinde, Profile property'si dolu olduğu için
        //   UserProfile tablosuna da otomatik INSERT yapar.
        //   AppUserId FK'sını EF Core kendisi set eder.
    };

    // ADIM 3: Identity ile kullanıcıyı kaydet
    var result = await _userManager.CreateAsync(user, request.Password);
    // CreateAsync ne yapar?
    // 1. Şifreyi hashler (PBKDF2 algoritması, 10000 iterasyon, 256-bit salt)
    // 2. Password policy kontrolü (8 karakter, büyük harf, özel karakter vs.)
    // 3. E-posta benzersizlik kontrolü (tekrar)
    // 4. SecurityStamp üretir
    // 5. AspNetUsers tablosuna INSERT
    // 6. İlişkili UserProfile'ı da INSERT (cascade)
    
    if (!result.Succeeded)
    {
        // Identity hata mesajlarını pipe ile birleştir
        // Örn: "Passwords must be at least 8 characters. | Passwords must have uppercase."
        var errors = string.Join(" | ", result.Errors.Select(e => e.Description));
        throw new DomainException($"Kayıt başarısız: {errors}");
    }

    // ADIM 4: JWT token üret ve yanıt oluştur
    var (token, expiration) = _tokenService.GenerateToken(user);
    // ↑ Tuple destructuring: GenerateToken (string, DateTime) döner,
    //   biz bunu iki ayrı değişkene açıyoruz.
    
    return BuildAuthResponse(user, token, expiration);
}
```

### Giriş Akışı (LoginAsync) — Güvenlik Detayları

```csharp
public async Task<AuthResponseDto> LoginAsync(LoginDto request)
{
    var user = await _userManager.FindByEmailAsync(request.Email);

    // GÜVENLİK: User Enumeration Koruması
    // ─────────────────────────────────────
    // Saldırgan şunu denemek isteyebilir:
    //   1. "test@email.com" + yanlış şifre → "Şifre yanlış" → Bu e-posta kayıtlı!
    //   2. "baska@email.com" + yanlış şifre → "Kullanıcı yok" → Bu e-posta kayıtlı değil!
    //
    // İki farklı mesaj döndürürsek saldırgan kayıtlı e-postaları tespit edebilir.
    // Çözüm: Her iki durumda da AYNI mesaj dön.
    
    var isPasswordValid = user != null && await _userManager.CheckPasswordAsync(user, request.Password);
    // ↑ Short-circuit evaluation:
    //   user == null ise CheckPasswordAsync ÇAĞRILMAZ (null reference hatası yok)
    //   user != null ise şifre kontrolü yapılır
    
    if (!isPasswordValid)
        throw new DomainException("E-posta veya şifre hatalı.");
        // ↑ Aynı mesaj! Saldırgan kullanıcı var mı yok mu anlayamaz.

    var (token, expiration) = _tokenService.GenerateToken(user!);
    // ↑ user! : null-forgiving. Buraya geldiyse user kesinlikle null değil
    //   (isPasswordValid = true → user != null olmalı)
    
    return BuildAuthResponse(user!, token, expiration);
}
```

### JWT Token Üretimi — TokenService Detayları

```csharp
public (string Token, DateTime Expiration) GenerateToken(AppUser user)
{
    // 1. İmzalama anahtarı oluştur
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
    // ↑ Symmetric: Aynı anahtar hem imzalama hem doğrulamada kullanılır.
    //   Asymmetric (RSA) olsaydı: private key ile imzala, public key ile doğrula.
    //   Symmetric tek sunucu için yeterli. Microservice'lerde asymmetric tercih edilir.

    var expiration = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryInMinutes);

    // 2. Token'a gömülecek bilgiler (claims)
    var claims = new List<Claim>
    {
        // ClaimTypes.NameIdentifier: ASP.NET'in standart claim tipi.
        // Controller'da: User.FindFirstValue(ClaimTypes.NameIdentifier) → userId
        new Claim(ClaimTypes.NameIdentifier, user.Id),
        
        // sub (subject): JWT RFC 7519 standardı. userId'nin JWT standart karşılığı.
        new Claim(JwtRegisteredClaimNames.Sub, user.Id),
        
        // email: Bilgi amaçlı. Token içinden e-posta okunabilir.
        new Claim(JwtRegisteredClaimNames.Email, user.Email!),
        
        // name: Bilgi amaçlı. Frontend token decode edip karşılama yapabilir.
        new Claim(JwtRegisteredClaimNames.Name, user.Name ?? string.Empty),
        
        // jti (JWT ID): Her token'a benzersiz GUID.
        // Şimdilik kullanılmıyor ama gelecekte token blacklist/revocation için:
        // "Bu jti'li token iptal edildi" → Redis/DB'de saklayıp kontrol et.
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    };

    // 3. Token tanımlayıcı oluştur
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(claims),
        Expires = expiration,
        Issuer = _jwtSettings.Issuer,      // Kim oluşturdu
        Audience = _jwtSettings.Audience,  // Kimin için
        SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature)
        // ↑ HMAC-SHA256: Hash-based Message Authentication Code
        //   Token'ın header + payload kısmını secret key ile hashler.
        //   Değiştirme girişimi hash'i bozar → token reddedilir.
    };

    // 4. Token'ı oluştur ve string'e çevir
    var tokenHandler = new JwtSecurityTokenHandler();
    var securityToken = tokenHandler.CreateToken(tokenDescriptor);
    var tokenString = tokenHandler.WriteToken(securityToken);
    
    return (tokenString, expiration);
    // ↑ Tuple return: iki değeri tek dönüş ile ver.
    //   Ayrı bir DTO sınıfı yaratmak yerine tuple kullanmak hafif çözümdür.
}
```

---

## 2. Swipe ve Eşleşme Motoru — Satır Satır

### SwipeAsync — En Karmaşık İş Metodu

```
Senaryo: Ahmet, Zeynep'i beğeniyor (Like).
Zeynep daha önce Ahmet'i SuperLike yapmış.
→ MATCH oluşmalı!
```

```csharp
public async Task<SwipeResultDto> SwipeAsync(string senderId, SwipeRequestDto request)
{
    // ═══════════════════════════════════════════
    // ADIM 1: Self-Swipe Engeli
    // ═══════════════════════════════════════════
    if (string.Equals(senderId, request.ReceiverId, StringComparison.Ordinal))
        throw new DomainException("Kendinize swipe işlemi yapamazsınız.");
    // Neden StringComparison.Ordinal?
    // GUID string'leri karşılaştırırken kültüre bağlı karşılaştırma gereksiz.
    // Ordinal en hızlı karşılaştırma yöntemidir (byte-by-byte).

    // ═══════════════════════════════════════════
    // ADIM 2: SwipeType Parse (String → Enum)
    // ═══════════════════════════════════════════
    if (!Enum.TryParse<SwipeType>(request.SwipeType, ignoreCase: true, out var swipeType))
        throw new DomainException("Geçersiz swipe tipi.");
    // ignoreCase: true → "like", "LIKE", "Like" hepsi kabul edilir.
    // TryParse vs Parse: Parse başarısız olunca exception fırlatır.
    // TryParse başarısız olunca false döner — kontrollü hata yönetimi.

    // ═══════════════════════════════════════════
    // ADIM 3: Mükerrer Swipe Kontrolü (Idempotency)
    // ═══════════════════════════════════════════
    if (await _swipeRepository.HasSwipedAsync(senderId, request.ReceiverId))
        throw new DomainException("Bu kullanıcıya zaten swipe yaptınız.");
    // HasSwipedAsync SQL: SELECT EXISTS(... WHERE SenderId=@s AND ReceiverId=@r)
    // Neden önemli? Mükerrer swipe olursa:
    // 1. LikedProfilesCount çift sayılır
    // 2. İki aynı match kaydı oluşabilir
    // 3. Kullanıcı deneyimi bozulur

    // ═══════════════════════════════════════════
    // ADIM 4: Receiver Varlık Kontrolü
    // ═══════════════════════════════════════════
    var receiver = await _userRepository.GetUserWithProfileAsync(request.ReceiverId, tracking: true);
    if (receiver?.Profile == null)
        throw new NotFoundException("Eşleşilecek kullanıcı bulunamadı.");
    // tracking: true → Çünkü match olursa receiver.Profile.MatchesCount++ yapacağız.
    // Change Tracker bu değişikliği yakalayıp SaveChanges'ta UPDATE üretecek.
    // tracking: false olsaydı değişiklik veritabanına YAZILMAZDI.

    // ═══════════════════════════════════════════
    // ADIM 5: Swipe Kaydı Oluştur
    // ═══════════════════════════════════════════
    var newSwipe = new UserSwipe
    {
        SenderId = senderId,
        ReceiverId = request.ReceiverId,
        SwipeType = swipeType
        // CreatedAt: Entity'de DateTime.UtcNow varsayılanı var, otomatik set edilir
    };
    await _swipeRepository.AddAsync(newSwipe);
    // AddAsync: EF Core Change Tracker'a "Added" durumunda ekler.
    // VERİTABANINA HENÜZ YAZILMADI! SaveChanges bekliyor.

    var result = new SwipeResultDto
    {
        IsMatch = false,
        Message = "Swipe kaydedildi."
    };

    // ═══════════════════════════════════════════
    // ADIM 6: Eşleşme Kontrolü
    // ═══════════════════════════════════════════
    if (swipeType != SwipeType.Pass)  // Pass asla match tetiklemez
    {
        var reciprocalSwipe = await _swipeRepository
            .GetReciprocalPositiveSwipeAsync(senderId, request.ReceiverId);
        // Bu sorgu: "Receiver daha önce sender'a Like veya SuperLike atmış mı?"
        // SQL: SELECT TOP 1 FROM UserSwipes
        //      WHERE SenderId = @receiverId    (ters yön!)
        //        AND ReceiverId = @senderId     (ters yön!)
        //        AND SwipeType != Pass

        if (reciprocalSwipe != null)  // Karşılıklı beğeni var → MATCH!
        {
            // Sender'ın profilini de tracking ile yükle
            var sender = await _userRepository.GetUserWithProfileAsync(senderId, tracking: true);
            if (sender?.Profile == null)
                throw new NotFoundException("Kullanıcı profili bulunamadı.");

            // Match kaydı oluştur
            await _matchRepository.AddAsync(new UserMatch
            {
                User1Id = senderId,           // Son swipe'ı atan
                User2Id = request.ReceiverId  // İlk swipe'ı atan
                // MatchedAt: Entity'de DateTime.UtcNow varsayılanı var
            });

            // İki tarafın da match sayacını artır
            sender.Profile.MatchesCount += 1;
            receiver.Profile.MatchesCount += 1;
            // Bu değişiklikler Change Tracker tarafından yakalanır.
            // SaveChanges'ta otomatik UPDATE sorgusu üretilir.

            result.IsMatch = true;
            result.MatchedUserId = request.ReceiverId;
            result.Message = "Eşleşme oldu!";
        }
    }

    // ═══════════════════════════════════════════
    // ADIM 7: Atomik Kayıt (Tek Transaction)
    // ═══════════════════════════════════════════
    await _swipeRepository.SaveChangesAsync();
    // Bu TEK çağrı şunları yapar (eşleşme varsa):
    // 1. INSERT INTO UserSwipes (SenderId, ReceiverId, SwipeType, CreatedAt) VALUES (...)
    // 2. INSERT INTO UserMatches (User1Id, User2Id, MatchedAt) VALUES (...)
    // 3. UPDATE UserProfiles SET MatchesCount = MatchesCount + 1 WHERE Id = @senderId
    // 4. UPDATE UserProfiles SET MatchesCount = MatchesCount + 1 WHERE Id = @receiverId
    //
    // Hepsi aynı transaction'da! Biri başarısız olursa ROLLBACK → hiçbiri uygulanmaz.
    // Bu "atomik tutarlılık" sağlar. Yarım kalmış veri olmaz.

    return result;
}
```

---

## 3. Uyumluluk Hesaplama — Matematiksel Detay

### Algoritma: Manhattan Distance Tabanlı Benzerlik

```csharp
public double Calculate(BasicTestResults? current, BasicTestResults? candidate)
{
    // Test çözmemiş kullanıcılar için orta değer
    if (current == null || candidate == null)
        return 50.0;  // "Belirsiz" — ne çok uyumlu ne uyumsuz

    // Her boyutta mutlak farkları topla (Manhattan Distance)
    var totalDiff =
        Math.Abs(current.SocialEnergy - candidate.SocialEnergy) +           // |3.5 - 4.0| = 0.5
        Math.Abs(current.OrderApproach - candidate.OrderApproach) +         // |4.0 - 2.0| = 2.0
        Math.Abs(current.ConflictManagement - candidate.ConflictManagement)+// |2.5 - 3.0| = 0.5
        Math.Abs(current.SharingStyle - candidate.SharingStyle) +           // |4.0 - 4.5| = 0.5
        Math.Abs(current.LifeRhythm - candidate.LifeRhythm) +              // |3.0 - 3.5| = 0.5
        Math.Abs(current.CommunicationStyle - candidate.CommunicationStyle);// |4.5 - 4.0| = 0.5
    // totalDiff = 4.5

    var avgDiff = totalDiff / 6.0;  // Ortalama fark: 4.5 / 6 = 0.75
    
    // Farkı yüzdeye çevir:
    // MaxDiff = 4.0 (1-5 ölçekte olası max fark: |1-5| = 4)
    // avgDiff = 0 → (4-0)/4 * 100 = %100 (birebir aynı)
    // avgDiff = 4 → (4-4)/4 * 100 = %0 (tam zıt)
    // avgDiff = 0.75 → (4-0.75)/4 * 100 = %81.25
    return Math.Round(Math.Max(0, ((4.0 - avgDiff) / 4.0) * 100), 1);
    // Math.Max(0, ...) : Negatif sonuç olmasını engeller
    // Math.Round(..., 1) : Bir ondalık basamağa yuvarla → 81.3
}
```

### Hesaplama Örnekleri Tablosu

| Kullanıcı A | Kullanıcı B | totalDiff | avgDiff | Uyumluluk |
|-------------|-------------|-----------|---------|-----------|
| [3,3,3,3,3,3] | [3,3,3,3,3,3] | 0 | 0 | **%100.0** |
| [1,1,1,1,1,1] | [5,5,5,5,5,5] | 24 | 4.0 | **%0.0** |
| [3,4,2,3,4,3] | [4,3,3,4,3,4] | 6 | 1.0 | **%75.0** |
| [5,5,5,5,5,5] | [4,4,4,4,4,4] | 6 | 1.0 | **%75.0** |
| [1,5,1,5,1,5] | [5,1,5,1,5,1] | 24 | 4.0 | **%0.0** |
| Herhangi | null (test yok) | — | — | **%50.0** |

---

## 4. Feed Sıralama Algoritması — Detaylı

```csharp
public async Task<IEnumerable<UserSummaryDto>> GetFeedAsync(string currentUserId, int skip, int take)
{
    // Güvenlik: Sayfalama parametrelerini clamp et
    if (skip < 0) skip = 0;           // Negatif skip anlamsız
    if (take <= 0) take = 20;         // Varsayılan
    if (take > 50) take = 50;         // DoS koruması: max 50

    // Mevcut kullanıcının FinalScores'unu al (uyumluluk hesabı için)
    var currentUser = await _userRepository.GetUserWithProfileAsync(currentUserId, tracking: false);
    var currentScores = currentUser?.Profile?.FinalScores;

    // TÜM adayları çek (filtrelenmiş: kendisi ve swipe edilenler hariç)
    var candidates = await _userRepository.GetFeedCandidatesWithLikeStatusAsync(currentUserId);

    // Her aday için: DTO'ya dönüştür + uyumluluk hesapla + sırala + sayfala
    return candidates
        .Select(item =>
        {
            var dto = MapToDto(item.User);
            dto.Compatibility = _compatibilityService.Calculate(currentScores, item.User.Profile?.FinalScores);
            return (Dto: dto, item.HasLikedCurrentUser);
            // ↑ Anonymous tuple: DTO + beğeni durumunu birlikte taşı
        })
        .OrderByDescending(x => x.HasLikedCurrentUser)  // 1. SIRALAMA: Beni beğenenler ÖNCE
        .ThenByDescending(x => x.Dto.Compatibility)       // 2. SIRALAMA: Uyumluluk yüksek → önce
        .ThenByDescending(x => x.Dto.LastActive)           // 3. SIRALAMA: Son aktif → önce
        .Skip(skip)   // Sayfalama: ilk N kaydı atla
        .Take(take)   // Sayfalama: sonraki M kaydı al
        .Select(x => x.Dto);  // Sadece DTO'yu döndür (HasLikedCurrentUser artık gerekli değil)
}
```

**Sıralama görselleştirmesi:**

```
Tüm adaylar (filtreleme sonrası):
┌──────────────┬─────────────────┬──────────────┬─────────────┐
│ Kullanıcı    │ BeniBeğenmiş?   │ Uyumluluk    │ SonAktif    │
├──────────────┼─────────────────┼──────────────┼─────────────┤
│ Zeynep       │ ✅ Evet          │ %85          │ 2 saat önce │ ← 1. sıra
│ Merve        │ ✅ Evet          │ %72          │ 1 gün önce  │ ← 2. sıra
│ Ali          │ ❌ Hayır         │ %91          │ 30 dk önce  │ ← 3. sıra
│ Burak        │ ❌ Hayır         │ %78          │ 3 saat önce │ ← 4. sıra
│ Ece          │ ❌ Hayır         │ %78          │ 1 hafta önce│ ← 5. sıra
│ Deniz        │ ❌ Hayır         │ %45          │ 10 dk önce  │ ← 6. sıra
└──────────────┴─────────────────┴──────────────┴─────────────┘
```

Zeynep ve Merve seni beğenmiş → en üste çıkarlar. Aralarında uyumluluğa göre sıralanırlar.

---

## 5. Test Sonuçları İşleme — İki Aşamalı Sistem

### Neden İki Aşama?

```
Aşama 1 (Temel Test) — ZORUNLU
├── 6 soru, her biri 1-5 arası
├── Hızlı: 2 dakikada tamamlanır
├── FinalScores = Temel test sonuçları
└── Eşleşme algoritması çalışmaya başlar

Aşama 2 (Detaylı Test) — OPSİYONEL
├── Her boyut için birden fazla soru (ör. 5'er soru)
├── Daha hassas: boyut ortalaması hesaplanır
├── FinalScores = Detaylı testin ortalamaları
└── Eşleşme skoru daha güvenilir hale gelir
```

### Detaylı Testte FinalScores Nasıl Güncellenir?

```csharp
// Detaylı test gönderimi:
// Client: { detailedSocialEnergy: [3, 4, 3, 5, 2] }

user.Profile.FinalScores = new BasicTestResults
{
    SocialEnergy = dto.DetailedSocialEnergy.Average(),       // [3,4,3,5,2].Average() = 3.4
    OrderApproach = dto.DetailedOrderApproach.Average(),      // [4,4,3,5,4].Average() = 4.0
    ConflictManagement = dto.DetailedConflictManagement.Average(),
    SharingStyle = dto.DetailedSharingStyle.Average(),
    LifeRhythm = dto.DetailedLifeRhythm.Average(),
    CommunicationStyle = dto.DetailedCommunicationStyle.Average()
};
```

### Validation Neden Önemli?

```csharp
private static void ValidateDetailedTestDto(DetailedTestResultDto dto)
{
    if (!dto.DetailedSocialEnergy.Any()) 
        throw new DomainException("SocialEnergy boyutu boş olamaz.");
    // ...
}
```

Boş liste (`[]`) gönderirlse `Average()` metodu `InvalidOperationException` fırlatır — bu iç hata client'a sızmamalı. Validation ile biz kontrol edip anlamlı hata mesajı dönüyoruz.

---

## 6. Property (İlan) Yönetimi — CRUD + Yetkilendirme

### Genel Yapı

PropertyService, standart CRUD operasyonlarını owner-based yetkilendirme ile birleştirir. Kullanıcı sadece kendi ilanlarını güncelleyebilir ve silebilir.

### Filtrelenebilir Liste — Sorgu Zinciri

```csharp
public async Task<IEnumerable<PropertyDto>> GetListAsync(
    string? location, PropertyType? propertyType, decimal? maxPrice,
    int? bedrooms, bool? petsAllowed, int skip, int take)
{
    // DoS koruması — Feed ile aynı pattern
    if (skip < 0) skip = 0;
    if (take <= 0) take = DefaultTake;  // 20
    if (take > MaxTake) take = MaxTake; // 50

    var properties = await _propertyRepository.GetFilteredAsync(
        location, propertyType, maxPrice, bedrooms, petsAllowed, skip, take);
    return properties.Select(MapToDto);
}
```

**Repository'deki filtre zinciri:**

```csharp
var query = _context.Properties.AsNoTracking().Include(p => p.Owner).AsQueryable();

// Her filtre parametresi null değilse WHERE'e eklenir
if (!string.IsNullOrWhiteSpace(location))
    query = query.Where(p => p.Location.Contains(location));  // Kısmi eşleşme
if (propertyType.HasValue)
    query = query.Where(p => p.PropertyType == propertyType.Value);
if (maxPrice.HasValue)
    query = query.Where(p => p.PriceAmount <= maxPrice.Value);
// ... bedrooms, petsAllowed da aynı şekilde

return await query.OrderByDescending(p => p.AvailableFrom)  // En yeniler önce
    .Skip(skip).Take(take).ToListAsync();
```

Bu "conditional WHERE chaining" deseni, filtre parametresi gönderilmezse o koşulun sorguya dahil olmamasını sağlar. Tüm filtreler opsiyoneldir.

### Owner Yetkilendirmesi — Update ve Delete

```csharp
public async Task<PropertyDto> UpdateAsync(int id, string currentUserId, UpdatePropertyDto dto)
{
    var property = await _propertyRepository.GetByIdAsync(id);
    if (property == null)
        throw new NotFoundException($"İlan bulunamadı. Id: {id}");

    // KRİTİK: Token'dan gelen userId ile ilan sahibi eşleşmeli
    if (property.OwnerId != currentUserId)
        throw new DomainException("Bu ilanı düzenleme yetkiniz yok.");
    // Controller bu exception'ı yakalayıp 403 Forbidden döner.

    // ... alanları güncelle, kaydet
}
```

**Neden bu kontrol önemli?**
Eğer bu kontrol olmazsa, herhangi bir authenticated kullanıcı başkasının ilanını güncelleyebilir veya silebilir. Token'dan gelen `OwnerId` ile `property.OwnerId`'yi karşılaştırmak, **IDOR (Insecure Direct Object Reference)** saldırısını engeller.

### Fiyat Formatlama — MapToDto

```csharp
private static PropertyDto MapToDto(Property p) => new()
{
    // ... diğer alanlar
    Price = $"{p.Currency}{p.PriceAmount:N0}/{p.PricePeriod}",
    // Örnekler:
    //   Currency="₺", PriceAmount=8500, PricePeriod="ay" → "₺8,500/ay"
    //   Currency="$", PriceAmount=1200, PricePeriod="month" → "$1,200/month"
    // N0 format: Binlik ayracı ekler, ondalık kısmı göstermez
    
    OwnerName = p.Owner?.Name ?? string.Empty
    // Owner null ise (navigation yüklenmediyse) boş string döner
};
```

### DataAnnotations Validation

Faz 4 ile birlikte tüm DTO'lara `DataAnnotations` validation eklendi:

```csharp
// CreatePropertyDto / UpdatePropertyDto
[Required]
[StringLength(200, MinimumLength = 3)]
public string Title { get; set; }

[Range(0, 1_000_000)]
public decimal PriceAmount { get; set; }
```

ASP.NET Core, `[ApiController]` attribute'u sayesinde validation hatalarını otomatik olarak **400 Bad Request** ile döner. Service katmanına ulaşmadan kötü veri engellenir.

Bu validation diğer DTO'lara da uygulandı:

| DTO | Önemli Kurallar |
|-----|----------------|
| `RegisterDto` | Email zorunlu + format, şifre min 8 karakter, isim 2-100 karakter |
| `LoginDto` | Email zorunlu + format, şifre max 100 karakter |
| `SwipeRequestDto` | ReceiverId zorunlu, SwipeType regex ile `Like\|Pass\|SuperLike` |
| `UpdateProfileDto` | Bio max 500, budget max 100, cleanliness/socialLevel 1-5 arası |
| `CreatePropertyDto` | Title 3-200, price 0-1M, location 2-200, description max 2000 |
