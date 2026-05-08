using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Domain.Enums;
using EvArkadasimV2.Domain.ValueObjects;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EvArkadasimV2.Infrastructure.Data
{
    public static class DataSeeder
    {
        public const string SeedPassword = "Test1234!";
        private const string EmailDomain = "@test.com";

        // (Ad, Soyad, Yaş, Şehir, Meslek, LookingFor, Bio, Temizlik 1-5, Sosyallik 1-5)
        private static readonly (string F, string L, int Age, string City, string Job, LookingFor LF, string Bio, int Clean, int Social)[] UserDefs =
        {
            // ── İSTANBUL · Ev Sahibi (user1–5) ─────────────────────────────────────
            ("Can",     "Akın",    28, "İstanbul", "Yazılım Mühendisi", LookingFor.Roommate, "Beşiktaş'ta ferah dairem var, temiz ve sakin ev arkadaşı arıyorum.",    5, 3),
            ("Selin",   "Yıldız",  26, "İstanbul", "Tasarımcı",         LookingFor.Roommate, "Kadıköy'de stüdyom var. Yaratıcı, uyumlu biri arıyorum.",               4, 4),
            ("Mert",    "Kaya",    30, "İstanbul", "Avukat",            LookingFor.Roommate, "Şişli'de 2+1 dairem var. Çalışkan, düzenli biri olsun.",                 5, 2),
            ("Zeynep",  "Arslan",  25, "İstanbul", "Mimar",             LookingFor.Roommate, "Üsküdar'da güzel bir evim var. Sakin ev arkadaşı arıyorum.",             4, 3),
            ("Burak",   "Çelik",   32, "İstanbul", "Pazarlama Uzmanı",  LookingFor.Roommate, "Levent'te modern dairem var. Profesyonel biri tercihim.",               3, 4),
            // ── İSTANBUL · Ev Arıyor (user6–20) ────────────────────────────────────
            ("Elif",    "Demir",   23, "İstanbul", "Öğrenci",           LookingFor.Room, "Boğaziçi 2. sınıf, Beşiktaş veya Sarıyer tercihim.",                        3, 5),
            ("Arda",    "Şahin",   27, "İstanbul", "Yazılım Mühendisi", LookingFor.Room, "Yeni işe başladım, merkezi bir yerde kalmak istiyorum.",                     4, 3),
            ("Büşra",   "Öztürk",  24, "İstanbul", "Öğretmen",          LookingFor.Room, "Sessiz, temizlik konusunda hassasım. Kadıköy civarı.",                       5, 2),
            ("Kaan",    "Yılmaz",  29, "İstanbul", "Mühendis",          LookingFor.Room, "İş yerim Maslak, yakın semtlere bakıyorum.",                                 4, 4),
            ("Ceren",   "Doğan",   22, "İstanbul", "Öğrenci",           LookingFor.Room, "İTÜ öğrencisiyim, Maslak veya Levent tercihim.",                            3, 5),
            ("Emre",    "Polat",   26, "İstanbul", "Tasarımcı",         LookingFor.Room, "Kreatif biriyle eşleşmek isterim. Moda veya Beyoğlu.",                       2, 5),
            ("Pınar",   "Kılıç",   28, "İstanbul", "Muhasebeci",        LookingFor.Room, "Düzenli, sakin ev tercihim. Anadolu yakası.",                                5, 2),
            ("Onur",    "Coşkun",  31, "İstanbul", "Doktor",            LookingFor.Room, "Hastane yakını, Şişli veya Beyoğlu tercihim.",                               4, 3),
            ("Esra",    "Bulut",   25, "İstanbul", "Pazarlama Uzmanı",  LookingFor.Room, "Sosyal biriyle paylaşım evinde kalmak istiyorum.",                           3, 5),
            ("Tolga",   "Akın",    30, "İstanbul", "Yazılım Mühendisi", LookingFor.Room, "Homeoffice çalışıyorum, sessiz ortam önemli.",                               4, 2),
            ("Cemre",   "Soylu",   24, "İstanbul", "Öğrenci",           LookingFor.Room, "Marmara Üniversitesi öğrencisiyim.",                                         3, 4),
            ("Umut",    "Özer",    27, "İstanbul", "Yazılım Mühendisi", LookingFor.Room, "Uzaktan çalışıyorum, sessiz ev arıyorum.",                                   4, 2),
            ("Rüya",    "Uçar",    23, "İstanbul", "Öğrenci",           LookingFor.Room, "Galatasaray Üniversitesi, Beşiktaş civarı.",                                 4, 5),
            ("Tunahan", "Duman",   28, "İstanbul", "Tasarımcı",         LookingFor.Room, "Yaratıcı ortam, Karaköy veya Galata.",                                       2, 5),
            ("Almila",  "Karahan", 26, "İstanbul", "Mühendis",          LookingFor.Room, "Kadıköy veya Moda tercihim.",                                                4, 4),
            // ── ANKARA · Ev Sahibi (user21–22) ──────────────────────────────────────
            ("Mustafa", "Güneş",   34, "Ankara",   "Devlet Memuru",     LookingFor.Roommate, "Çankaya'da 3+1 evim var. Sakin, düzenli birini arıyorum.",              5, 3),
            ("Hatice",  "Çetin",   29, "Ankara",   "Öğretmen",          LookingFor.Roommate, "Kızılay yakını dairem var. Paylaşımcı biri olsun.",                     4, 4),
            // ── ANKARA · Ev Arıyor (user23–28) ──────────────────────────────────────
            ("Ali",     "Koç",     24, "Ankara",   "Öğrenci",           LookingFor.Room, "ODTÜ öğrencisiyim, kampüse yakın yer arıyorum.",                            3, 4),
            ("Fatma",   "Kurt",    27, "Ankara",   "Mühendis",          LookingFor.Room, "Yeni işe başladım, Çankaya veya Kızılay.",                                  4, 3),
            ("Hüseyin", "Özdemir", 26, "Ankara",   "Tasarımcı",         LookingFor.Room, "Sakin mahalle, düzenli ev arıyorum.",                                       5, 2),
            ("Merve",   "Koçak",   23, "Ankara",   "Öğrenci",           LookingFor.Room, "Hacettepe öğrencisiyim, bütçem uygun.",                                     3, 4),
            ("İbrahim", "Yıldız",  28, "Ankara",   "Avukat",            LookingFor.Room, "Merkezi konumda, sessiz bir ev arıyorum.",                                  4, 2),
            ("Ayşe",    "Polat",   25, "Ankara",   "Öğretmen",          LookingFor.Room, "Temizliğe önem veren biriyle olmak isterim.",                               5, 3),
            // ── İZMİR · Ev Sahibi (user29–30) ───────────────────────────────────────
            ("Osman",   "Erdoğan", 35, "İzmir",    "Mimar",             LookingFor.Roommate, "Alsancak'ta 2+1 dairem var. Keyifli ortam için doğru kişi arıyorum.",  4, 4),
            ("Yusuf",   "Acar",    31, "İzmir",    "Yazılım Mühendisi", LookingFor.Roommate, "Karşıyaka'da güzel bir evim var. IT sektöründen biri olsa harika.",    3, 4),
            // ── İZMİR · Ev Arıyor (user31–35) ───────────────────────────────────────
            ("Lara",    "Güler",   27, "İzmir",    "Öğrenci",           LookingFor.Room, "Ege Üniversitesi öğrencisiyim, Bornova veya Alsancak.",                     3, 5),
            ("Deniz",   "Tekin",   24, "İzmir",    "Öğrenci",           LookingFor.Room, "EÜ öğrencisiyim, paylaşımlı ev arıyorum.",                                  3, 5),
            ("Berk",    "Ateş",    28, "İzmir",    "Mühendis",          LookingFor.Room, "Yeni işe başladım, Alsancak çevresi.",                                       4, 3),
            ("Defne",   "Bozkurt", 26, "İzmir",    "Tasarımcı",         LookingFor.Room, "Kreatif ortam, sakin ev arıyorum.",                                          4, 4),
            ("Kerem",   "Özcan",   29, "İzmir",    "Öğretmen",          LookingFor.Room, "Sessiz mahalle, temiz ev tercihim.",                                         5, 2),
            // ── BURSA · Ev Sahibi (user36) ───────────────────────────────────────────
            ("Hasan",   "Demirci", 38, "Bursa",    "Müteahhit",         LookingFor.Roommate, "Osmangazi'de geniş evim var. Uzun vadeli ev arkadaşı arıyorum.",        4, 3),
            // ── BURSA · Ev Arıyor (user37–39) ───────────────────────────────────────
            ("Naz",     "Yücel",   23, "Bursa",    "Öğrenci",           LookingFor.Room, "UÜ öğrencisiyim, uygun fiyatlı yer arıyorum.",                              3, 4),
            ("Mura",    "Kaplan",  27, "Bursa",    "Mühendis",          LookingFor.Room, "Yeni taşındım Bursa'ya, ev arıyorum.",                                       4, 3),
            ("Sude",    "Ertürk",  25, "Bursa",    "Öğretmen",          LookingFor.Room, "Sakin ortam, temiz ev arıyorum.",                                            5, 2),
            // ── DİĞER ŞEHİRLER (user40–50) ──────────────────────────────────────────
            ("Eren",    "Güven",   26, "Antalya",  "Turizm Uzmanı",     LookingFor.Room, "Muratpaşa civarında uygun yer arıyorum.",                                   3, 5),
            ("Asya",    "Saygın",  24, "Antalya",  "Öğrenci",           LookingFor.Room, "AKÜ öğrencisiyim, merkeze yakın.",                                          3, 4),
            ("Mira",    "Aksoy",   22, "Eskişehir","Öğrenci",           LookingFor.Room, "ESOGÜ öğrencisiyim, kampüse yakın.",                                        4, 5),
            ("Furkan",  "Tunç",    25, "Eskişehir","Mühendis",          LookingFor.Room, "Yeni mezun, uygun ev arıyorum.",                                             3, 3),
            ("Berkay",  "Çakır",   28, "Konya",    "Öğretmen",          LookingFor.Room, "Selçuklu civarında sakin yer arıyorum.",                                    4, 3),
            ("İrem",    "Aslan",   24, "Konya",    "Öğrenci",           LookingFor.Room, "KÜ öğrencisiyim.",                                                           3, 4),
            ("Sinan",   "Erol",    30, "Adana",    "Mühendis",          LookingFor.Room, "Seyhan civarında ev arıyorum.",                                              4, 3),
            ("Ece",     "Bayrak",  26, "Adana",    "Öğretmen",          LookingFor.Room, "Merkezi konumda, uygun fiyatlı.",                                            3, 4),
            ("Yiğit",   "Sevim",   27, "Trabzon",  "Mühendis",          LookingFor.Room, "KTÜ yakını ev arıyorum.",                                                    4, 3),
            ("Tuna",    "Işık",    23, "Trabzon",  "Öğrenci",           LookingFor.Room, "KTÜ 3. sınıf, uygun bütçe.",                                                3, 4),
            ("Barış",   "Gündüz",  29, "Gaziantep","Mühendis",          LookingFor.Room, "İş yerime yakın yer arıyorum.",                                              4, 3),
        }; // toplam: 50

        // Her Roommate user için bir property. OwnerEmail → user{N}@test.com ile eşleşir.
        private static readonly (string Email, string Title, decimal Price, string Loc, int Beds, int Baths, PropertyType Type, bool Furnished, bool Pets, bool Smoke, string Desc, double Lat, double Lng)[] PropertyDefs =
        {
            ("user1@test.com",  "Beşiktaş'ta Ferah 2+1 Daire",    15000, "İstanbul, Beşiktaş",  2, 1, PropertyType.Apartment, true,  false, false, "Metro'ya 5 dakika, balkonlu, eşyalı modern daire.",       41.0422, 29.0077),
            ("user2@test.com",  "Kadıköy Merkez Stüdyo",            9500, "İstanbul, Kadıköy",   1, 1, PropertyType.Studio,    true,  true,  false, "Kadıköy çarşısına yürüme mesafesinde, kompakt stüdyo.",    40.9905, 29.0269),
            ("user3@test.com",  "Şişli'de Modern 2+1 Daire",       13000, "İstanbul, Şişli",     2, 1, PropertyType.Apartment, false, false, false, "Yeni tadilatlı, güneş alan, merkezi konum.",              41.0603, 28.9877),
            ("user4@test.com",  "Üsküdar Sahil Yakını 1+1",        10000, "İstanbul, Üsküdar",   1, 1, PropertyType.Apartment, true,  false, false, "Boğaz manzaralı, sahile 10 dakika yürüme.",               41.0228, 29.0128),
            ("user5@test.com",  "Levent'te Lüks 3+1 Daire",        20000, "İstanbul, Levent",    3, 2, PropertyType.Apartment, true,  false, false, "AVM ve iş merkezlerine yakın, site içi, güvenlikli.",     41.0817, 29.0103),
            ("user21@test.com", "Çankaya'da 3+1 Geniş Konut",      12000, "Ankara, Çankaya",     3, 2, PropertyType.House,     false, true,  false, "Sakin mahallede, bahçe katı, otoparklı.",                  39.9083, 32.8575),
            ("user22@test.com", "Kızılay 2+1 Eşyalı Daire",        11000, "Ankara, Kızılay",     2, 1, PropertyType.Apartment, true,  true,  false, "AVM ve metro yakını, tam eşyalı, aydınlık.",              39.9199, 32.8543),
            ("user29@test.com", "Alsancak'ta 2+1 Daire",            9000, "İzmir, Alsancak",     2, 1, PropertyType.Apartment, true,  false, false, "Denize 5 dakika, korunaklı site içi.",                    38.4374, 27.1429),
            ("user30@test.com", "Karşıyaka'da Ferah 2+1",           8500, "İzmir, Karşıyaka",    2, 1, PropertyType.Apartment, true,  true,  false, "Vapur iskelesine yakın, sakin mahalle.",                   38.4597, 27.1100),
            ("user36@test.com", "Osmangazi'de Bahçeli Müstakil",   13000, "Bursa, Osmangazi",    3, 2, PropertyType.House,     false, true,  true,  "Bahçeli müstakil ev, evcil hayvan dostu, geniş alan.",    40.1870, 29.0612),
        };

        private static readonly List<string>[] Lifestyles =
        {
            new() { "Sigara içmez", "Spor yapar", "Erken kalkar" },
            new() { "Evcil hayvan sever", "Kitap okur", "Gece kuşu" },
            new() { "Sigara içmez", "Vejetaryen", "Düzenli" },
            new() { "Spor yapar", "Sosyal", "Müzik dinler" },
            new() { "Sessiz ortam sever", "Erken yatar", "Temizliğe önem verir" },
        };

        private static readonly List<string>[] InterestSets =
        {
            new() { "Müzik", "Sinema", "Yürüyüş" },
            new() { "Yemek", "Seyahat", "Fotoğraf" },
            new() { "Oyun", "Yoga", "Kitap" },
            new() { "Müzik", "Seyahat", "Spor" },
            new() { "Sinema", "Yemek", "Doğa" },
        };

        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<AppUser>>();
            var context = serviceProvider.GetRequiredService<AppDbContext>();
            var logger = serviceProvider.GetRequiredService<ILogger<AppDbContext>>();

            try
            {
                await SeedUsersAsync(userManager, context, logger);
                await SeedPropertiesAsync(context, logger);
                await SeedMatchesAndMessagesAsync(context, logger);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SEED ERROR] {ex.GetType().Name}: {ex.Message}");
                var inner = ex.InnerException;
                while (inner != null)
                {
                    Console.WriteLine($"  inner ({inner.GetType().Name}): {inner.Message}");
                    inner = inner.InnerException;
                }
                Console.WriteLine(ex.StackTrace);
                logger.LogError(ex, "DataSeeder başarısız. Inner: {Inner}", ex.InnerException?.Message);
            }
        }

        private static async Task SeedUsersAsync(
            UserManager<AppUser> userManager,
            AppDbContext context,
            ILogger logger)
        {
            var existingCount = await context.Users
                .CountAsync(u => u.Email != null && u.Email.EndsWith(EmailDomain));

            if (existingCount >= UserDefs.Length)
            {
                logger.LogInformation("Kullanıcı seed atlandı: {Count} kullanıcı zaten mevcut.", existingCount);
                return;
            }

            int added = 0;
            for (int i = 0; i < UserDefs.Length; i++)
            {
                var def = UserDefs[i];
                var email = $"user{i + 1}{EmailDomain}";

                if (await userManager.FindByEmailAsync(email) != null)
                    continue;

                var user = new AppUser
                {
                    UserName = email,
                    Email = email,
                    Name = def.F,
                    LastName = def.L,
                    Profile = BuildProfile(i, def),
                };

                var result = await userManager.CreateAsync(user, SeedPassword);
                if (result.Succeeded)
                    added++;
                else
                    logger.LogWarning("Seed kullanıcısı {Email} oluşturulamadı: {Errors}",
                        email, string.Join(" | ", result.Errors.Select(e => $"{e.Code}:{e.Description}")));
            }

            logger.LogInformation("Kullanıcı seed tamamlandı: {Count} kullanıcı eklendi.", added);
        }

        private static async Task SeedPropertiesAsync(AppDbContext context, ILogger logger)
        {
            if (await context.Properties.CountAsync() >= PropertyDefs.Length)
            {
                logger.LogInformation("Property seed atlandı: ilanlar zaten mevcut.");
                return;
            }

            int added = 0;
            foreach (var def in PropertyDefs)
            {
                var owner = await context.Users
                    .Include(u => u.Profile)
                    .FirstOrDefaultAsync(u => u.Email == def.Email);

                if (owner == null) continue;

                if (await context.Properties.AnyAsync(p => p.OwnerId == owner.Id))
                    continue;

                await context.Properties.AddAsync(new Property
                {
                    Title = def.Title,
                    PriceAmount = def.Price,
                    Currency = "₺",
                    PricePeriod = "ay",
                    Location = def.Loc,
                    Bedrooms = def.Beds,
                    Bathrooms = def.Baths,
                    PropertyType = def.Type,
                    Furnished = def.Furnished,
                    PetsAllowed = def.Pets,
                    SmokingAllowed = def.Smoke,
                    Description = def.Desc,
                    AvailableFrom = DateTime.UtcNow.AddDays(7),
                    Images = new List<string>(),
                    Amenities = new List<string>(),
                    Latitude = def.Lat,
                    Longitude = def.Lng,
                    OwnerId = owner.Id,
                });

                if (owner.Profile != null)
                    owner.Profile.LookingFor = LookingFor.Roommate;

                added++;
            }

            await context.SaveChangesAsync();
            logger.LogInformation("Property seed tamamlandı: {Count} ilan eklendi.", added);
        }

        private static async Task SeedMatchesAndMessagesAsync(AppDbContext context, ILogger logger)
        {
            if (await context.Set<UserMatch>().AnyAsync())
            {
                logger.LogInformation("Match/Message seed atlandı: kayıtlar zaten mevcut.");
                return;
            }

            // user1–user6 arasından 3 çift: Roommate + Room karışımı
            var emails = new[] { "user1", "user6", "user3", "user7", "user2", "user8" }
                .Select(u => $"{u}{EmailDomain}").ToList();

            var users = await context.Users
                .Where(u => emails.Contains(u.Email!))
                .OrderBy(u => u.Email)
                .ToListAsync();

            if (users.Count < 6)
            {
                logger.LogWarning("Match seed atlandı: yeterli kullanıcı bulunamadı ({Count}/6).", users.Count);
                return;
            }

            // Sıralama email'e göre: user1, user2, user3, user6, user7, user8
            var byEmail = users.ToDictionary(u => u.Email!);
            var pairs = new[]
            {
                (byEmail[$"user1{EmailDomain}"], byEmail[$"user6{EmailDomain}"]),
                (byEmail[$"user3{EmailDomain}"], byEmail[$"user7{EmailDomain}"]),
                (byEmail[$"user2{EmailDomain}"], byEmail[$"user8{EmailDomain}"]),
            };

            var now = DateTime.UtcNow;
            foreach (var (userA, userB) in pairs)
            {
                var matchedAt = now.AddDays(-new Random(userA.Email!.GetHashCode()).Next(1, 8));
                await context.Set<UserMatch>().AddAsync(new UserMatch
                {
                    User1Id = userA.Id,
                    User2Id = userB.Id,
                    MatchedAt = matchedAt,
                    CompatibilityScore = Math.Round(new Random(userB.Email!.GetHashCode()).NextDouble() * 40 + 55, 1),
                    User1HasSeen = true,
                    User2HasSeen = true,
                    Messages = BuildMessages(userA.Id, userB.Id, matchedAt),
                });
            }

            await context.SaveChangesAsync();
            logger.LogInformation("Match/Message seed tamamlandı: 3 eşleşme eklendi.");
        }

        private static List<Message> BuildMessages(string u1, string u2, DateTime matchedAt)
        {
            var t = matchedAt.AddHours(1);
            return new List<Message>
            {
                new() { SenderId = u1, Content = "Merhaba! Eşleştik, çok sevindim 😊",                         Type = MessageType.Text, Timestamp = t,             IsRead = true  },
                new() { SenderId = u2, Content = "Selam! Ben de 🙂 Ne zamandır ev arkadaşı arıyorsun?",         Type = MessageType.Text, Timestamp = t.AddHours(1),  IsRead = true  },
                new() { SenderId = u1, Content = "Yaklaşık 3 haftadır. Bütçem uygun mu sana?",                  Type = MessageType.Text, Timestamp = t.AddHours(2),  IsRead = true  },
                new() { SenderId = u2, Content = "Evet gayet uygun. Hangi semtlere bakıyorsun?",                Type = MessageType.Text, Timestamp = t.AddHours(3),  IsRead = true  },
                new() { SenderId = u1, Content = "Kadıköy veya Beşiktaş tercihim ama esnek olabilirim.",       Type = MessageType.Text, Timestamp = t.AddHours(20), IsRead = false },
                new() { SenderId = u2, Content = "Harika, benim de Kadıköy'de baktığım bir yer var. Atayım!", Type = MessageType.Text, Timestamp = t.AddHours(21), IsRead = false },
            };
        }

        private static UserProfile BuildProfile(int index, (string F, string L, int Age, string City, string Job, LookingFor LF, string Bio, int Clean, int Social) def)
        {
            // Her kullanıcı için deterministik ama farklı test skorları
            BasicTestResults MakeScores(int offset) => new()
            {
                SocialEnergy       = (double)((index * 7 + offset + 0) % 5) + 1,
                OrderApproach      = (double)((index * 7 + offset + 1) % 5) + 1,
                ConflictManagement = (double)((index * 7 + offset + 2) % 5) + 1,
                SharingStyle       = (double)((index * 7 + offset + 3) % 5) + 1,
                LifeRhythm         = (double)((index * 7 + offset + 4) % 5) + 1,
                CommunicationStyle = (double)((index * 7 + offset + 5) % 5) + 1,
            };

            return new UserProfile
            {
                Age        = def.Age,
                Bio        = def.Bio,
                Budget     = def.City == "İstanbul" ? $"{10 + index % 10}000 TL" : $"{6 + index % 8}000 TL",
                MoveInDate = DateTime.UtcNow.AddDays(index % 45 + 3).ToString("yyyy-MM-dd"),
                Occupation = def.Job,
                Education  = index % 3 switch { 0 => "Yüksek Lisans", 1 => "Lisans", _ => "Önlisans" },
                Location   = new Location { City = def.City, Distance = index % 20 + 1 },
                RoomType   = index % 4 == 3 ? null : (RoomType?)(index % 3),
                LookingFor = def.LF,
                Cleanliness  = def.Clean,
                SocialLevel  = def.Social,
                Lifestyle    = Lifestyles[index % Lifestyles.Length],
                Interests    = InterestSets[index % InterestSets.Length],
                Photos       = new List<string>(),
                IsVerified   = index % 7 == 0,
                InitialBasicTestResults = MakeScores(0),
                FinalScores             = MakeScores(1), // ayrı instance — EF owned type gerektiriyor
            };
        }
    }
}
