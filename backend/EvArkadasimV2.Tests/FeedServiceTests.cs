using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Application.Services;
using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Domain.ValueObjects;
using Moq;
using Xunit;

namespace EvArkadasimV2.Tests
{
    // FeedService: DB'den gelen adayları in-memory sıralar ve sayfalı döndürür.
    // IUserRepository ve ICompatibilityService mock'lanır — gerçek DB ve hesaplama gerekmez.
    public class FeedServiceTests
    {
        private readonly Mock<IUserRepository> _userRepo = new();
        private readonly Mock<ICompatibilityService> _compatibility = new();
        private readonly Mock<ICacheService> _cache = new();
        private readonly FeedService _sut;

        public FeedServiceTests()
        {
            _cache.Setup(c => c.SetAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<TimeSpan>()))
                  .Returns(Task.CompletedTask);
            _sut = new FeedService(_userRepo.Object, _compatibility.Object, _cache.Object);
            // Compatibility her çağrıda sabit 75 döndürür — sıralama mantığını test etmek için yeterli.
            _compatibility.Setup(c => c.Calculate(It.IsAny<BasicTestResults?>(), It.IsAny<BasicTestResults?>()))
                         .Returns(75.0);
        }

        private static AppUser MakeUser(string id, string email) => new()
        {
            Id = id, Email = email, Name = "Test",
            Profile = new UserProfile { Age = 25, LastActive = DateTime.UtcNow }
        };

        // Giriş yapan kullanıcı kendi feed'inde görünmemeli (repository zaten filtreliyor ama servis de korumalı).
        [Fact]
        public async Task GetFeedAsync_CurrentUserNotInResult()
        {
            var currentUser = MakeUser("current", "current@test.com");
            var other = MakeUser("other1", "other1@test.com");

            _userRepo.Setup(r => r.GetUserWithProfileAsync("current", false)).ReturnsAsync(currentUser);
            _userRepo.Setup(r => r.GetFeedCandidatesWithLikeStatusAsync("current"))
                     .ReturnsAsync(new List<(AppUser, bool)> { (other, false) });

            var result = await _sut.GetFeedAsync("current", 0, 20);

            Assert.DoesNotContain(result.Users, u => u.Id == "current");
        }

        // Like atan kullanıcı (HasLikedCurrentUser=true) sıralamada öne geçmeli.
        [Fact]
        public async Task GetFeedAsync_LikerAppearsBeforeNonLiker()
        {
            var current = MakeUser("current", "current@test.com");
            var liker = MakeUser("liker", "liker@test.com");
            var nonLiker = MakeUser("nonliker", "nonliker@test.com");

            _userRepo.Setup(r => r.GetUserWithProfileAsync("current", false)).ReturnsAsync(current);
            _userRepo.Setup(r => r.GetFeedCandidatesWithLikeStatusAsync("current"))
                     .ReturnsAsync(new List<(AppUser, bool)>
                     {
                         (nonLiker, false), // DB'den önce gelse de...
                         (liker, true)      // ...Like boost onu öne taşımalı.
                     });

            var result = await _sut.GetFeedAsync("current", 0, 20);

            var likerIndex = result.Users.FindIndex(u => u.Id == "liker");
            var nonLikerIndex = result.Users.FindIndex(u => u.Id == "nonliker");
            Assert.True(likerIndex < nonLikerIndex);
        }

        // Aday yoksa boş liste ve sıfır totalCount dönmeli.
        [Fact]
        public async Task GetFeedAsync_EmptyCandidates_ReturnsEmptyPagedResult()
        {
            var current = MakeUser("current", "current@test.com");
            _userRepo.Setup(r => r.GetUserWithProfileAsync("current", false)).ReturnsAsync(current);
            _userRepo.Setup(r => r.GetFeedCandidatesWithLikeStatusAsync("current"))
                     .ReturnsAsync(new List<(AppUser, bool)>());

            var result = await _sut.GetFeedAsync("current", 0, 20);

            Assert.Empty(result.Users);
            Assert.Equal(0, result.TotalCount);
            Assert.False(result.HasMore);
        }

        // 10 aday var, take=5 → ilk sayfa 5 kişi, HasMore=true, TotalCount=10 olmalı.
        [Fact]
        public async Task GetFeedAsync_SkipTake_HasMoreCorrect()
        {
            var current = MakeUser("current", "current@test.com");
            var candidates = Enumerable.Range(1, 10)
                .Select(i => (MakeUser($"u{i}", $"u{i}@test.com"), false))
                .ToList<(AppUser, bool)>();

            _userRepo.Setup(r => r.GetUserWithProfileAsync("current", false)).ReturnsAsync(current);
            _userRepo.Setup(r => r.GetFeedCandidatesWithLikeStatusAsync("current")).ReturnsAsync(candidates);

            var result = await _sut.GetFeedAsync("current", 0, 5);

            Assert.Equal(5, result.Users.Count);
            Assert.Equal(10, result.TotalCount);
            Assert.True(result.HasMore);
        }

        // Tüm adaylar tek sayfaya sığıyorsa HasMore=false olmalı.
        [Fact]
        public async Task GetFeedAsync_LastPage_HasMoreFalse()
        {
            var current = MakeUser("current", "current@test.com");
            var candidates = Enumerable.Range(1, 5)
                .Select(i => (MakeUser($"u{i}", $"u{i}@test.com"), false))
                .ToList<(AppUser, bool)>();

            _userRepo.Setup(r => r.GetUserWithProfileAsync("current", false)).ReturnsAsync(current);
            _userRepo.Setup(r => r.GetFeedCandidatesWithLikeStatusAsync("current")).ReturnsAsync(candidates);

            var result = await _sut.GetFeedAsync("current", 0, 20);

            Assert.False(result.HasMore);
        }

        // DoS koruması: take=100 girilse bile servis MaxTake=50 ile clamp etmeli.
        [Fact]
        public async Task GetFeedAsync_TakeOver50_ClampsTo50()
        {
            var current = MakeUser("current", "current@test.com");
            var candidates = Enumerable.Range(1, 100)
                .Select(i => (MakeUser($"u{i}", $"u{i}@test.com"), false))
                .ToList<(AppUser, bool)>();

            _userRepo.Setup(r => r.GetUserWithProfileAsync("current", false)).ReturnsAsync(current);
            _userRepo.Setup(r => r.GetFeedCandidatesWithLikeStatusAsync("current")).ReturnsAsync(candidates);

            var result = await _sut.GetFeedAsync("current", 0, 100);

            Assert.True(result.Users.Count <= 50);
        }

        // Negatif skip geçersiz — servis 0 olarak ele almalı, hata fırlatmamalı.
        [Fact]
        public async Task GetFeedAsync_NegativeSkip_TreatedAsZero()
        {
            var current = MakeUser("current", "current@test.com");
            var other = MakeUser("other", "other@test.com");

            _userRepo.Setup(r => r.GetUserWithProfileAsync("current", false)).ReturnsAsync(current);
            _userRepo.Setup(r => r.GetFeedCandidatesWithLikeStatusAsync("current"))
                     .ReturnsAsync(new List<(AppUser, bool)> { (other, false) });

            var result = await _sut.GetFeedAsync("current", -5, 20);

            Assert.Single(result.Users);
        }
    }
}
