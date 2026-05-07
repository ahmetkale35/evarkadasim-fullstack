using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Application.Services;
using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Domain.ValueObjects;
using Moq;
using Xunit;

namespace EvArkadasimV2.Tests
{
    // ProfileService: kullanıcı profilini DTO'ya dönüştürme mantığını test eder.
    // Odak: yeni eklenen InitialBasicTestResults ve FinalScores alanlarının doğru map'lenmesi.
    public class ProfileServiceTests
    {
        private readonly Mock<IUserRepository> _userRepo = new();
        private readonly Mock<ICacheService> _cache = new();
        private readonly ProfileService _sut;

        public ProfileServiceTests()
        {
            _sut = new ProfileService(_userRepo.Object, _cache.Object);
        }

        // Hem InitialBasicTestResults hem FinalScores dolu kullanıcı için
        // DTO her iki alanı da doldurmalı.
        // Neden önemli: bu alanlar az önce eklendi — null dönerse Postman 14 test patlar.
        [Fact]
        public async Task GetProfileAsync_BothScoresPresent_MapsBothToDto()
        {
            var scores = new BasicTestResults
            {
                SocialEnergy = 4, OrderApproach = 3, ConflictManagement = 2,
                SharingStyle = 5, LifeRhythm = 1, CommunicationStyle = 4
            };
            var user = MakeUser("u1", initialScores: scores, finalScores: scores);

            _userRepo.Setup(r => r.GetUserWithProfileAsync("u1", false)).ReturnsAsync(user);

            var dto = await _sut.GetProfileAsync("u1");

            Assert.NotNull(dto.InitialBasicTestResults);
            Assert.NotNull(dto.FinalScores);
            Assert.NotNull(dto.CharacterProfile);
        }

        // InitialBasicTestResults null iken FinalScores dolu olabilir
        // (kullanıcı temel testi atlamış, ama seed'den FinalScores gelmiş).
        // DTO InitialBasicTestResults için null dönmeli — hata fırlatmamalı.
        [Fact]
        public async Task GetProfileAsync_InitialScoresNull_ReturnsNullInitialInDto()
        {
            var finalScores = new BasicTestResults { SocialEnergy = 3 };
            var user = MakeUser("u1", initialScores: null, finalScores: finalScores);

            _userRepo.Setup(r => r.GetUserWithProfileAsync("u1", false)).ReturnsAsync(user);

            var dto = await _sut.GetProfileAsync("u1");

            Assert.Null(dto.InitialBasicTestResults);
            Assert.NotNull(dto.FinalScores);
        }

        // FinalScores null iken DTO hem FinalScores hem CharacterProfile için null döndürmeli.
        // Neden önemli: CharacterProfile FinalScores'dan map'leniyor — null guard gerekli.
        [Fact]
        public async Task GetProfileAsync_FinalScoresNull_ReturnsNullFinalAndCharacterProfile()
        {
            var user = MakeUser("u1", initialScores: null, finalScores: null);

            _userRepo.Setup(r => r.GetUserWithProfileAsync("u1", false)).ReturnsAsync(user);

            var dto = await _sut.GetProfileAsync("u1");

            Assert.Null(dto.FinalScores);
            Assert.Null(dto.CharacterProfile);
        }

        // FinalScores'daki değerler DTO'ya doğru kopyalanmalı.
        // Neden önemli: MapScores() helper yeni yazıldı — alan kopyalamayı test etmek gerekiyor.
        [Fact]
        public async Task GetProfileAsync_FinalScores_ValuesCorrectlyMapped()
        {
            var finalScores = new BasicTestResults
            {
                SocialEnergy = 4.5, OrderApproach = 3.2, ConflictManagement = 2.1,
                SharingStyle = 5.0, LifeRhythm = 1.8, CommunicationStyle = 4.3
            };
            var user = MakeUser("u1", initialScores: null, finalScores: finalScores);

            _userRepo.Setup(r => r.GetUserWithProfileAsync("u1", false)).ReturnsAsync(user);

            var dto = await _sut.GetProfileAsync("u1");

            Assert.Equal(4.5, dto.FinalScores!.SocialEnergy);
            Assert.Equal(3.2, dto.FinalScores.OrderApproach);
            Assert.Equal(2.1, dto.FinalScores.ConflictManagement);
            Assert.Equal(5.0, dto.FinalScores.SharingStyle);
            Assert.Equal(1.8, dto.FinalScores.LifeRhythm);
            Assert.Equal(4.3, dto.FinalScores.CommunicationStyle);
        }

        // Var olmayan userId → NotFoundException fırlatılmalı.
        [Fact]
        public async Task GetProfileAsync_UserNotFound_ThrowsNotFoundException()
        {
            _userRepo.Setup(r => r.GetUserWithProfileAsync("ghost", false)).ReturnsAsync((AppUser?)null);

            await Assert.ThrowsAsync<NotFoundException>(() => _sut.GetProfileAsync("ghost"));
        }

        // Kullanıcı var ama profili null → NotFoundException fırlatılmalı.
        // Neden önemli: AppUser.Profile lazy-load değil, null gelebilir.
        [Fact]
        public async Task GetProfileAsync_ProfileNull_ThrowsNotFoundException()
        {
            var user = new AppUser { Id = "u1", Profile = null! };
            _userRepo.Setup(r => r.GetUserWithProfileAsync("u1", false)).ReturnsAsync(user);

            await Assert.ThrowsAsync<NotFoundException>(() => _sut.GetProfileAsync("u1"));
        }

        private static AppUser MakeUser(string id, BasicTestResults? initialScores, BasicTestResults? finalScores) =>
            new()
            {
                Id = id,
                Name = "Test",
                Profile = new UserProfile
                {
                    Age = 25,
                    InitialBasicTestResults = initialScores,
                    FinalScores = finalScores
                }
            };
    }
}
