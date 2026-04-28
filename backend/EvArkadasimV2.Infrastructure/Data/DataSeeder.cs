using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Domain.Enums;
using EvArkadasimV2.Domain.ValueObjects;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EvArkadasimV2.Infrastructure.Data
{
    // Geliştirme ortamı için 50 sahte kullanıcı ekleyen seeder.
    // Üretimde çalıştırılmamalıdır; Program.cs'te yalnızca IsDevelopment koşuluyla çağrılır.
    public static class DataSeeder
    {
        // Tüm seed kullanıcılarının ortak şifresi. Identity password policy'sini karşılar:
        // büyük harf, küçük harf, rakam, özel karakter, en az 8 karakter.
        public const string SeedPassword = "Test1234!";

        // Email örüntüsü: user1@test.com ... user50@test.com
        // Sayısal son ek sayesinde Postman'de kolayca farklı kullanıcılarla giriş yapılabilir.
        private const string EmailDomain = "@test.com";
        private const int SeedUserCount = 50;

        private static readonly string[] FirstNames =
        {
            "Ahmet", "Mehmet", "Ali", "Mustafa", "Hüseyin", "Hasan", "İbrahim", "Osman", "Yusuf", "Murat",
            "Ayşe", "Fatma", "Emine", "Hatice", "Zeynep", "Elif", "Merve", "Esra", "Büşra", "Selin",
            "Can", "Cem", "Burak", "Emre", "Onur", "Kerem", "Berk", "Deniz", "Kaan", "Tolga",
            "Ceren", "Ece", "İrem", "Pınar", "Sude", "Naz", "Defne", "Asya", "Mira", "Lara",
            "Eren", "Arda", "Mert", "Ege", "Barış", "Sinan", "Tuna", "Yiğit", "Furkan", "Berkay"
        };

        private static readonly string[] Cities =
        {
            "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Eskişehir", "Konya", "Adana", "Trabzon", "Gaziantep"
        };

        private static readonly string[] Occupations =
        {
            "Yazılım Mühendisi", "Öğrenci", "Tasarımcı", "Pazarlama Uzmanı", "Doktor",
            "Öğretmen", "Mimar", "Mühendis", "Avukat", "Muhasebeci"
        };

        private static readonly string[] Educations =
        {
            "Lisans", "Yüksek Lisans", "Doktora", "Önlisans", "Lise"
        };

        private static readonly string[] LifestyleOptions =
        {
            "Sigara içmez", "Evcil hayvan sever", "Spor yapar", "Erken kalkar", "Vejetaryen", "Kitap okur"
        };

        private static readonly string[] InterestOptions =
        {
            "Müzik", "Sinema", "Yürüyüş", "Yemek", "Seyahat", "Oyun", "Fotoğraf", "Yoga"
        };

        // ServiceProvider ile çağrılır çünkü scoped servisleri (UserManager, DbContext) host'un
        // kök container'ından doğrudan alamayız → CreateScope() ile bir DI scope oluşturulur.
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<AppUser>>();
            var context = serviceProvider.GetRequiredService<AppDbContext>();
            var logger = serviceProvider.GetRequiredService<ILogger<AppDbContext>>();

            // Tüm seed gövdesini try/catch ile sarıyoruz — küçük bir konfigürasyon hatası
            // bile (owned type, FK, unique index) tüm app start'ı çökertmesin diye:
            // exception'ı detaylı logla + Console'a da yaz, sonra dev ortamı için yutalım.
            try
            {
                await SeedInternalAsync(userManager, context, logger);
            }
            catch (Exception ex)
            {
                // Console.WriteLine: ILogger çıktısı bazı host'larda buffer'lanıp kaybolabilir;
                // Console direkt stderr/stdout'a yazar ve crash öncesi kesin görünür.
                Console.WriteLine($"[SEED ERROR] {ex.GetType().Name}: {ex.Message}");
                var inner = ex.InnerException;
                while (inner != null)
                {
                    Console.WriteLine($"  inner ({inner.GetType().Name}): {inner.Message}");
                    inner = inner.InnerException;
                }
                Console.WriteLine(ex.StackTrace);

                logger.LogError(ex, "DataSeeder başarısız. Inner: {Inner}", ex.InnerException?.Message);
                // App'in seed başarısızlığıyla crash etmesini engelle; geliştirici hatayı
                // yukarıdaki log'tan görür ve düzelttikten sonra DB'yi sıfırlayıp tekrar dener.
            }
        }

        private static async Task SeedInternalAsync(
            UserManager<AppUser> userManager,
            AppDbContext context,
            ILogger logger)
        {
            // Random'a sabit seed → her çalıştırmada deterministik veri üretilir.
            var random = new Random(42);

            // --- KULLANICI SEED ---
            var existingSeedCount = await context.Users
                .CountAsync(u => u.Email != null && u.Email.EndsWith(EmailDomain));

            if (existingSeedCount < SeedUserCount)
            {
                int successCount = 0;
                for (int i = 1; i <= SeedUserCount; i++)
                {
                    var email = $"user{i}{EmailDomain}";

                    if (await userManager.FindByEmailAsync(email) != null)
                        continue;

                    var firstName = FirstNames[(i - 1) % FirstNames.Length];
                    var user = new AppUser
                    {
                        UserName = email,
                        Email = email,
                        Name = firstName,
                        Profile = BuildProfile(random, firstName)
                    };

                    var result = await userManager.CreateAsync(user, SeedPassword);

                    if (result.Succeeded)
                        successCount++;
                    else
                    {
                        var errors = string.Join(" | ", result.Errors.Select(e => $"{e.Code}:{e.Description}"));
                        logger.LogWarning("Seed kullanıcısı {Email} oluşturulamadı: {Errors}", email, errors);
                    }
                }

                logger.LogInformation("Kullanıcı seed tamamlandı: {Count} kullanıcı eklendi.", successCount);
            }
            else
            {
                logger.LogInformation("Kullanıcı seed atlandı: {Count} kullanıcı zaten mevcut.", existingSeedCount);
            }

            // --- PROPERTY SEED ---
            await SeedPropertiesAsync(context, logger);
        }

        private static async Task SeedPropertiesAsync(AppDbContext context, ILogger logger)
        {
            const int PropertySeedCount = 10;

            if (await context.Properties.CountAsync() >= PropertySeedCount)
            {
                logger.LogInformation("Property seed atlandı: ilanlar zaten mevcut.");
                return;
            }

            var ownerIds = await context.Users
                .Where(u => u.Email != null && u.Email.EndsWith(EmailDomain))
                .Take(5)
                .Select(u => u.Id)
                .ToListAsync();

            if (!ownerIds.Any())
            {
                logger.LogWarning("Property seed atlandı: owner kullanıcı bulunamadı.");
                return;
            }

            var properties = new List<Property>
            {
                new() {
                    Title = "Beşiktaş'ta Ferah 2+1 Daire",
                    PriceAmount = 15000, Currency = "₺", PricePeriod = "ay",
                    Location = "İstanbul, Beşiktaş",
                    Bedrooms = 2, Bathrooms = 1,
                    Description = "Metro'ya 5 dakika, balkonlu, eşyalı modern daire.",
                    PropertyType = PropertyType.Apartment,
                    Furnished = true, PetsAllowed = false, SmokingAllowed = false,
                    AvailableFrom = DateTime.UtcNow.AddDays(7),
                    Amenities = new List<string> { "Wi-Fi", "Çamaşır Makinesi", "Bulaşık Makinesi" },
                    Images = new List<string>(),
                    OwnerId = ownerIds[0]
                },
                new() {
                    Title = "Kadıköy Merkez Stüdyo",
                    PriceAmount = 8500, Currency = "₺", PricePeriod = "ay",
                    Location = "İstanbul, Kadıköy",
                    Bedrooms = 1, Bathrooms = 1,
                    Description = "Kadıköy çarşısına yürüme mesafesinde, kompakt stüdyo.",
                    PropertyType = PropertyType.Studio,
                    Furnished = true, PetsAllowed = true, SmokingAllowed = false,
                    AvailableFrom = DateTime.UtcNow.AddDays(14),
                    Amenities = new List<string> { "Wi-Fi", "Klima" },
                    Images = new List<string>(),
                    OwnerId = ownerIds[1 % ownerIds.Count]
                },
                new() {
                    Title = "Çankaya'da 3+1 Geniş Konut",
                    PriceAmount = 12000, Currency = "₺", PricePeriod = "ay",
                    Location = "Ankara, Çankaya",
                    Bedrooms = 3, Bathrooms = 2,
                    Description = "Sakin mahallede, bahçe katı, otoparklı.",
                    PropertyType = PropertyType.House,
                    Furnished = false, PetsAllowed = true, SmokingAllowed = false,
                    AvailableFrom = DateTime.UtcNow.AddDays(30),
                    Amenities = new List<string> { "Otopark", "Güvenlik", "Bahçe" },
                    Images = new List<string>(),
                    OwnerId = ownerIds[2 % ownerIds.Count]
                },
                new() {
                    Title = "Alsancak'ta Oda Kiralık",
                    PriceAmount = 5500, Currency = "₺", PricePeriod = "ay",
                    Location = "İzmir, Alsancak",
                    Bedrooms = 1, Bathrooms = 1,
                    Description = "3 kişilik paylaşım evinde tek kişilik oda, ortak mutfak ve salon.",
                    PropertyType = PropertyType.Room,
                    Furnished = true, PetsAllowed = false, SmokingAllowed = false,
                    AvailableFrom = DateTime.UtcNow.AddDays(3),
                    Amenities = new List<string> { "Wi-Fi", "Çamaşır Makinesi" },
                    Images = new List<string>(),
                    OwnerId = ownerIds[3 % ownerIds.Count]
                },
                new() {
                    Title = "Şişli'de 1+1 Temiz Daire",
                    PriceAmount = 10000, Currency = "₺", PricePeriod = "ay",
                    Location = "İstanbul, Şişli",
                    Bedrooms = 1, Bathrooms = 1,
                    Description = "Yeni tadilatlı, güneş alan, merkezi konum.",
                    PropertyType = PropertyType.Apartment,
                    Furnished = false, PetsAllowed = false, SmokingAllowed = true,
                    AvailableFrom = DateTime.UtcNow.AddDays(10),
                    Amenities = new List<string> { "Asansör", "Kapıcı" },
                    Images = new List<string>(),
                    OwnerId = ownerIds[4 % ownerIds.Count]
                },
                new() {
                    Title = "Kızılay 2+1 Eşyalı Daire",
                    PriceAmount = 11000, Currency = "₺", PricePeriod = "ay",
                    Location = "Ankara, Kızılay",
                    Bedrooms = 2, Bathrooms = 1,
                    Description = "AVM ve metro yakını, tam eşyalı, aydınlık.",
                    PropertyType = PropertyType.Apartment,
                    Furnished = true, PetsAllowed = true, SmokingAllowed = false,
                    AvailableFrom = DateTime.UtcNow.AddDays(20),
                    Amenities = new List<string> { "Wi-Fi", "Klima", "Çamaşır Makinesi" },
                    Images = new List<string>(),
                    OwnerId = ownerIds[0]
                },
                new() {
                    Title = "Üsküdar Sahil Yakını Stüdyo",
                    PriceAmount = 9000, Currency = "₺", PricePeriod = "ay",
                    Location = "İstanbul, Üsküdar",
                    Bedrooms = 1, Bathrooms = 1,
                    Description = "Boğaz manzaralı, sahile 10 dakika, eşyalı stüdyo.",
                    PropertyType = PropertyType.Studio,
                    Furnished = true, PetsAllowed = false, SmokingAllowed = false,
                    AvailableFrom = DateTime.UtcNow.AddDays(5),
                    Amenities = new List<string> { "Wi-Fi", "Klima", "Balkon" },
                    Images = new List<string>(),
                    OwnerId = ownerIds[1 % ownerIds.Count]
                },
                new() {
                    Title = "Bornova'da Paylaşımlı Ev",
                    PriceAmount = 4500, Currency = "₺", PricePeriod = "ay",
                    Location = "İzmir, Bornova",
                    Bedrooms = 1, Bathrooms = 1,
                    Description = "Ege Üniversitesi yakını, 4 kişilik evde oda.",
                    PropertyType = PropertyType.Room,
                    Furnished = true, PetsAllowed = false, SmokingAllowed = false,
                    AvailableFrom = DateTime.UtcNow.AddDays(1),
                    Amenities = new List<string> { "Wi-Fi" },
                    Images = new List<string>(),
                    OwnerId = ownerIds[2 % ownerIds.Count]
                },
                new() {
                    Title = "Osmangazi'de Müstakil Ev",
                    PriceAmount = 13000, Currency = "₺", PricePeriod = "ay",
                    Location = "Bursa, Osmangazi",
                    Bedrooms = 3, Bathrooms = 2,
                    Description = "Bahçeli müstakil ev, evcil hayvan dostu, geniş alan.",
                    PropertyType = PropertyType.House,
                    Furnished = false, PetsAllowed = true, SmokingAllowed = true,
                    AvailableFrom = DateTime.UtcNow.AddDays(45),
                    Amenities = new List<string> { "Bahçe", "Otopark", "Depo" },
                    Images = new List<string>(),
                    OwnerId = ownerIds[3 % ownerIds.Count]
                },
                new() {
                    Title = "Muratpaşa 2+1 Tatil Beldesi Dairesi",
                    PriceAmount = 9500, Currency = "₺", PricePeriod = "ay",
                    Location = "Antalya, Muratpaşa",
                    Bedrooms = 2, Bathrooms = 1,
                    Description = "Site içi, havuzlu, denize 15 dakika.",
                    PropertyType = PropertyType.Apartment,
                    Furnished = true, PetsAllowed = false, SmokingAllowed = false,
                    AvailableFrom = DateTime.UtcNow.AddDays(15),
                    Amenities = new List<string> { "Havuz", "Güvenlik", "Wi-Fi" },
                    Images = new List<string>(),
                    OwnerId = ownerIds[4 % ownerIds.Count]
                },
            };

            await context.Properties.AddRangeAsync(properties);
            await context.SaveChangesAsync();
            logger.LogInformation("Property seed tamamlandı: {Count} ilan eklendi.", properties.Count);
        }

        private static UserProfile BuildProfile(Random random, string firstName)
        {
            // BasicTestResults: eşleşme algoritması FinalScores üzerinden çalıştığı için
            // her sahte kullanıcının da rastgele bir karakter profili olması gerekir.
            // InitialBasicTestResults ve FinalScores iki ayrı owned tablo; aynı C# referansını
            // ikisine birden atarsak EF "bu satır hangi UserProfile'a ait?" sorusunu çözemez
            // ("principal entity is not known" hatası). Her property için ayrı instance üretiyoruz.
            var socialEnergy = (double)random.Next(1, 6);
            var orderApproach = (double)random.Next(1, 6);
            var conflictManagement = (double)random.Next(1, 6);
            var sharingStyle = (double)random.Next(1, 6);
            var lifeRhythm = (double)random.Next(1, 6);
            var communicationStyle = (double)random.Next(1, 6);

            BasicTestResults NewScores() => new BasicTestResults
            {
                SocialEnergy = socialEnergy,
                OrderApproach = orderApproach,
                ConflictManagement = conflictManagement,
                SharingStyle = sharingStyle,
                LifeRhythm = lifeRhythm,
                CommunicationStyle = communicationStyle
            };

            return new UserProfile
            {
                Age = random.Next(20, 36),
                Bio = $"Merhaba, ben {firstName}. Ev arkadaşı arıyorum.",
                Budget = $"{random.Next(5, 21) * 1000} TL",
                MoveInDate = DateTime.UtcNow.AddDays(random.Next(0, 60)).ToString("yyyy-MM-dd"),
                Occupation = Occupations[random.Next(Occupations.Length)],
                Education = Educations[random.Next(Educations.Length)],
                Location = new Location
                {
                    City = Cities[random.Next(Cities.Length)],
                    Distance = random.Next(1, 50)
                },
                // RoomType: 4'te 1 ihtimalle null (kullanıcının "fark etmez" dediği durum).
                // Enum'da 3 değer var (Private=0, Shared=1, Studio=2); 3 değeri null'a map.
                RoomType = random.Next(0, 4) is var rt && rt == 3 ? null : (RoomType?)rt,
                LookingFor = (LookingFor)random.Next(0, 3),
                // Ölçek 1-5: profil tercihleri ve karakter testi skorları aynı ölçeği kullanır.
                // CompatibilityService MaxDiff=4 bu ölçeği varsayar.
                Cleanliness = random.Next(1, 6),
                SocialLevel = random.Next(1, 6),
                Lifestyle = LifestyleOptions.OrderBy(_ => random.Next()).Take(3).ToList(),
                Interests = InterestOptions.OrderBy(_ => random.Next()).Take(3).ToList(),
                Photos = new List<string>(),
                IsVerified = false,
                InitialBasicTestResults = NewScores(),
                FinalScores = NewScores()
            };
        }
    }
}
