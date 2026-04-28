# 📚 EvArkadasimV2 Backend — Belgeler

Kişilik testi tabanlı ev arkadaşı eşleştirme platformu — ASP.NET Core 6, Clean Architecture.

```bash
# Hızlı Başlangıç
cd EvArkadasimV2/backend/EvArkadasimV2.API
dotnet run
# Swagger UI: https://localhost:7xxx/swagger
# Test hesabı: user1@test.com / Test1234!
```

---

## 📖 Analiz (Eğitim / Öğrenme Amaçlı)

Projedeki **her satırın neden orada olduğunu** açıklayan belgeler. "Bu neden böyle yapılmış?", "Bu kavram ne?" sorularına cevap verir. Kod okumayı ve yazılım mimarisini öğrenmek isteyenler için.

| Dosya | İçerik |
|-------|--------|
| [ANALIZ-PART1.md](./ANALIZ-PART1.md) | **Domain & Application katmanları**: Entity'ler satır satır, Value Object'ler, DTO deseni neden var, Interface'ler, 6 servisin iş mantığı, Exception hiyerarşisi |
| [ANALIZ-PART2.md](./ANALIZ-PART2.md) | **Infrastructure & API katmanları**: DbContext ve Fluent API, Repository implementasyonları, JWT token üretimi, DataSeeder tuzakları, Controller deseni, **30 öğrenilecek kavram listesi** |

---

## 📋 Dokümantasyon (Profesyonel Referans)

Projeyi **kullanmak, geliştirmek ve deploy etmek** isteyenler için teknik referans. API şemaları, veritabanı diyagramları, konfigürasyon rehberi içerir.

| # | Dosya | İçerik |
|---|-------|--------|
| 1 | [01-OVERVIEW.md](./01-OVERVIEW.md) | Proje tanımı, hızlı başlangıç, Clean Architecture detaylı, Dependency Injection nasıl çalışır, konfigürasyon her satır açıklamalı, middleware pipeline |
| 2 | [02-API-REFERENCE.md](./02-API-REFERENCE.md) | **9 endpoint**: request/response JSON örnekleri, query parametreleri, hata kodları tablosu |
| 3 | [03-DATABASE.md](./03-DATABASE.md) | ER diyagramı, ilişkiler, Cascade vs Restrict, Owned Types sütun yapısı, JSON conversion detayları, enum değerleri, migration komutları |
| 4 | [04-BUSINESS-LOGIC.md](./04-BUSINESS-LOGIC.md) | Auth akışı satır satır, Swipe/match 7 adım detaylı, uyumluluk formülü + örnekler, feed sıralama görselleştirmesi, test sistemi |
| 5 | [05-SECURITY-AND-DEV-GUIDE.md](./05-SECURITY-AND-DEV-GUIDE.md) | Güvenlik (auth sequence diyagramı, şifre hashleme, CORS), performans (AsNoTracking, N+1, HashSet), yeni özellik ekleme adım adım, paket listesi, eksik özellikler |

---

## Fark Nedir?

| | 📖 Analiz | 📋 Dokümantasyon |
|---|-----------|-----------------|
| **Amaç** | Öğrenmek, anlamak | Kullanmak, geliştirmek |
| **Soru** | "Bu satır ne yapıyor? Neden böyle?" | "Bu API'ye nasıl istek atarım?" |
| **Ton** | Öğretici, açıklayıcı | Referans, teknik |
| **Okuyucu** | Kodu ilk kez gören geliştirici | Projeyi geliştiren/deploy eden ekip |
| **Örnek** | "null! operatörü C# derleyicisine..." | `POST /api/auth/login` → `{ "email": "..." }` |

---

## Teknoloji Özeti

| Bileşen | Teknoloji |
|---------|-----------|
| Framework | ASP.NET Core 6.0 |
| ORM | Entity Framework Core 6 |
| Veritabanı | SQLite |
| Kimlik | ASP.NET Identity + JWT |
| API Docs | Swagger (Swashbuckle) |
| Mimari | Clean Architecture (4 katman) |
