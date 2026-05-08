using EvArkadasimV2.Application.DTOs.Test;
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
    // TestService: temel ve detaylı test sonuçlarının profile yazılma mantığını test eder.
    // Odak: EF owned type bug fix (ayrı instance) ve FinalScores güncelleme davranışı.
    public class TestServiceTests
    {
        private readonly Mock<IUserRepository> _userRepo = new();
        private readonly Mock<ICacheService> _cache = new();
        private readonly TestService _sut;

        public TestServiceTests()
        {
            _cache.Setup(c => c.RemoveAsync(It.IsAny<string>())).Returns(Task.CompletedTask);
            _sut = new TestService(_userRepo.Object, _cache.Object);
        }

        // Temel test gönderilince InitialBasicTestResults DTO değerlerini almalı.
        [Fact]
        public async Task SubmitBasicTest_SetsInitialBasicTestResults()
        {
            var user = MakeUser("u1", hasProfile: true);
            _userRepo.Setup(r => r.GetUserWithProfileAsync("u1", true)).ReturnsAsync(user);
            _userRepo.Setup(r => r.SaveChangesAsync()).ReturnsAsync(true);

            await _sut.SubmitBasicTestAsync("u1", MakeBasicDto(socialEnergy: 4, orderApproach: 3));

            Assert.NotNull(user.Profile!.InitialBasicTestResults);
            Assert.Equal(4, user.Profile.InitialBasicTestResults!.SocialEnergy);
            Assert.Equal(3, user.Profile.InitialBasicTestResults.OrderApproach);
        }

        // Temel test gönderilince FinalScores da aynı değerleri taşımalı.
        // Neden önemli: eşleşme algoritması FinalScores'u kullanır — boş kalırsa kimse eşleşemez.
        [Fact]
        public async Task SubmitBasicTest_SetsFinalScoresWithSameValues()
        {
            var user = MakeUser("u1", hasProfile: true);
            _userRepo.Setup(r => r.GetUserWithProfileAsync("u1", true)).ReturnsAsync(user);
            _userRepo.Setup(r => r.SaveChangesAsync()).ReturnsAsync(true);

            await _sut.SubmitBasicTestAsync("u1", MakeBasicDto(socialEnergy: 4, orderApproach: 3));

            Assert.NotNull(user.Profile!.FinalScores);
            Assert.Equal(4, user.Profile.FinalScores!.SocialEnergy);
            Assert.Equal(3, user.Profile.FinalScores.OrderApproach);
        }

        // InitialBasicTestResults ve FinalScores FARKLI C# instance olmalı.
        // Neden önemli: EF Core owned type aynı referansı iki property'e atamayı desteklemiyor.
        // Aynı referans atanırsa SaveChanges "principal entity is not known" hatası fırlatır.
        [Fact]
        public async Task SubmitBasicTest_InitialAndFinalScores_AreDifferentInstances()
        {
            var user = MakeUser("u1", hasProfile: true);
            _userRepo.Setup(r => r.GetUserWithProfileAsync("u1", true)).ReturnsAsync(user);
            _userRepo.Setup(r => r.SaveChangesAsync()).ReturnsAsync(true);

            await _sut.SubmitBasicTestAsync("u1", MakeBasicDto());

            Assert.NotSame(user.Profile!.InitialBasicTestResults, user.Profile.FinalScores);
        }

        // Detaylı test gönderilince FinalScores her boyutun ortalamasına güncellenmeli.
        // Neden önemli: eşleşme skoru bu ortalamalarla hesaplanıyor.
        [Fact]
        public async Task SubmitDetailedTest_UpdatesFinalScoresToAverages()
        {
            var user = MakeUser("u1", hasProfile: true, withInitialScores: true);
            _userRepo.Setup(r => r.GetUserWithProfileAsync("u1", true)).ReturnsAsync(user);
            _userRepo.Setup(r => r.SaveChangesAsync()).ReturnsAsync(true);

            var dto = new DetailedTestResultDto
            {
                DetailedSocialEnergy = new List<int> { 3, 5 },        // ortalama 4.0
                DetailedOrderApproach = new List<int> { 2, 4 },       // ortalama 3.0
                DetailedConflictManagement = new List<int> { 1, 3 },  // ortalama 2.0
                DetailedSharingStyle = new List<int> { 4, 4 },        // ortalama 4.0
                DetailedLifeRhythm = new List<int> { 2, 4 },          // ortalama 3.0
                DetailedCommunicationStyle = new List<int> { 3, 5 }   // ortalama 4.0
            };

            await _sut.SubmitDetailedTestAsync("u1", dto);

            Assert.Equal(4.0, user.Profile!.FinalScores!.SocialEnergy);
            Assert.Equal(3.0, user.Profile.FinalScores.OrderApproach);
            Assert.Equal(2.0, user.Profile.FinalScores.ConflictManagement);
        }

        // Detaylı test gönderilince InitialBasicTestResults değişmemeli.
        // Neden önemli: başlangıç skoru geçmişi bozulmamalı — sadece FinalScores güncellenir.
        [Fact]
        public async Task SubmitDetailedTest_DoesNotChangeInitialBasicTestResults()
        {
            var user = MakeUser("u1", hasProfile: true, withInitialScores: true);
            var originalSocialEnergy = user.Profile!.InitialBasicTestResults!.SocialEnergy;

            _userRepo.Setup(r => r.GetUserWithProfileAsync("u1", true)).ReturnsAsync(user);
            _userRepo.Setup(r => r.SaveChangesAsync()).ReturnsAsync(true);

            await _sut.SubmitDetailedTestAsync("u1", MakeDetailedDto());

            Assert.Equal(originalSocialEnergy, user.Profile.InitialBasicTestResults!.SocialEnergy);
        }

        // Temel test tamamlanmadan detaylı test → DomainException.
        // Neden önemli: detaylı test temel teste göre ek soru sorar; sıra zorunlu.
        [Fact]
        public async Task SubmitDetailedTest_WithoutBasicTest_ThrowsDomainException()
        {
            var user = MakeUser("u1", hasProfile: true, withInitialScores: false);
            _userRepo.Setup(r => r.GetUserWithProfileAsync("u1", true)).ReturnsAsync(user);

            await Assert.ThrowsAsync<DomainException>(() =>
                _sut.SubmitDetailedTestAsync("u1", MakeDetailedDto()));
        }

        // Var olmayan kullanıcı → NotFoundException.
        [Fact]
        public async Task SubmitBasicTest_UserNotFound_ThrowsNotFoundException()
        {
            _userRepo.Setup(r => r.GetUserWithProfileAsync("ghost", true)).ReturnsAsync((AppUser?)null);

            await Assert.ThrowsAsync<NotFoundException>(() =>
                _sut.SubmitBasicTestAsync("ghost", MakeBasicDto()));
        }

        private static AppUser MakeUser(string id, bool hasProfile, bool withInitialScores = false) =>
            new()
            {
                Id = id,
                Profile = hasProfile ? new UserProfile
                {
                    InitialBasicTestResults = withInitialScores
                        ? new BasicTestResults { SocialEnergy = 3, OrderApproach = 3, ConflictManagement = 3, SharingStyle = 3, LifeRhythm = 3, CommunicationStyle = 3 }
                        : null
                } : null!
            };

        private static BasicTestResultDto MakeBasicDto(double socialEnergy = 3, double orderApproach = 3) =>
            new()
            {
                SocialEnergy = socialEnergy,
                OrderApproach = orderApproach,
                ConflictManagement = 3,
                SharingStyle = 3,
                LifeRhythm = 3,
                CommunicationStyle = 3
            };

        private static DetailedTestResultDto MakeDetailedDto() =>
            new()
            {
                DetailedSocialEnergy = new List<int> { 3, 3 },
                DetailedOrderApproach = new List<int> { 3, 3 },
                DetailedConflictManagement = new List<int> { 3, 3 },
                DetailedSharingStyle = new List<int> { 3, 3 },
                DetailedLifeRhythm = new List<int> { 3, 3 },
                DetailedCommunicationStyle = new List<int> { 3, 3 }
            };
    }
}
