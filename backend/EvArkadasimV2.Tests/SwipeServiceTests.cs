using EvArkadasimV2.Application.DTOs.User;
using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Application.Services;
using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Domain.Enums;
using Moq;
using Xunit;

namespace EvArkadasimV2.Tests
{
    // SwipeService: swipe kaydetme, match oluşturma ve iş kuralı kontrollerini test eder.
    // Tüm repository'ler mock'lanır — gerçek DB'ye ihtiyaç yok.
    public class SwipeServiceTests
    {
        private readonly Mock<ISwipeRepository> _swipeRepo = new();
        private readonly Mock<IMatchRepository> _matchRepo = new();
        private readonly Mock<IUserRepository> _userRepo = new();
        private readonly Mock<ICompatibilityService> _compatibility = new();
        private readonly SwipeService _sut;

        public SwipeServiceTests()
        {
            _sut = new SwipeService(_swipeRepo.Object, _matchRepo.Object, _userRepo.Object, _compatibility.Object);
        }

        private static AppUser MakeUser(string id) => new()
        {
            Id = id,
            Profile = new UserProfile { MatchesCount = 0 }
        };

        private static SwipeRequestDto Req(string receiverId, string type) =>
            new() { ReceiverId = receiverId, SwipeType = type };

        // Kullanıcı kendi ID'sine swipe atarsa iş kuralı ihlali → DomainException.
        [Fact]
        public async Task SwipeAsync_SelfSwipe_ThrowsDomainException()
        {
            await Assert.ThrowsAsync<DomainException>(() =>
                _sut.SwipeAsync("user1", Req("user1", "Like")));
        }

        // "InvalidType" gibi tanımsız swipe tipi → DomainException.
        [Fact]
        public async Task SwipeAsync_InvalidSwipeType_ThrowsDomainException()
        {
            _swipeRepo.Setup(r => r.HasSwipedAsync("user1", "user2")).ReturnsAsync(false);
            _userRepo.Setup(r => r.GetUserWithProfileAsync("user2", true)).ReturnsAsync(MakeUser("user2"));

            await Assert.ThrowsAsync<DomainException>(() =>
                _sut.SwipeAsync("user1", Req("user2", "InvalidType")));
        }

        // Aynı kişiye ikinci kez swipe → idempotency koruması devreye girmeli.
        [Fact]
        public async Task SwipeAsync_DuplicateSwipe_ThrowsDomainException()
        {
            _swipeRepo.Setup(r => r.HasSwipedAsync("user1", "user2")).ReturnsAsync(true);

            await Assert.ThrowsAsync<DomainException>(() =>
                _sut.SwipeAsync("user1", Req("user2", "Like")));
        }

        // Var olmayan kullanıcıya swipe → NotFoundException.
        [Fact]
        public async Task SwipeAsync_ReceiverNotFound_ThrowsNotFoundException()
        {
            _swipeRepo.Setup(r => r.HasSwipedAsync("user1", "ghost")).ReturnsAsync(false);
            _userRepo.Setup(r => r.GetUserWithProfileAsync("ghost", true)).ReturnsAsync((AppUser?)null);

            await Assert.ThrowsAsync<NotFoundException>(() =>
                _sut.SwipeAsync("user1", Req("ghost", "Like")));
        }

        // Pass swipe hiçbir zaman match oluşturmamalı.
        [Fact]
        public async Task SwipeAsync_PassSwipe_NoMatchCreated()
        {
            var receiver = MakeUser("user2");
            _swipeRepo.Setup(r => r.HasSwipedAsync("user1", "user2")).ReturnsAsync(false);
            _userRepo.Setup(r => r.GetUserWithProfileAsync("user2", true)).ReturnsAsync(receiver);

            var result = await _sut.SwipeAsync("user1", Req("user2", "Pass"));

            Assert.False(result.IsMatch);
            // AddAsync hiç çağrılmamalı — match oluşmamalı.
            _matchRepo.Verify(r => r.AddAsync(It.IsAny<UserMatch>()), Times.Never);
        }

        // Tek taraflı Like → karşılıklı swipe yoksa match oluşmamalı.
        [Fact]
        public async Task SwipeAsync_LikeWithNoReciprocal_NoMatchCreated()
        {
            var receiver = MakeUser("user2");
            _swipeRepo.Setup(r => r.HasSwipedAsync("user1", "user2")).ReturnsAsync(false);
            _userRepo.Setup(r => r.GetUserWithProfileAsync("user2", true)).ReturnsAsync(receiver);
            _swipeRepo.Setup(r => r.GetReciprocalPositiveSwipeAsync("user1", "user2")).ReturnsAsync((UserSwipe?)null);

            var result = await _sut.SwipeAsync("user1", Req("user2", "Like"));

            Assert.False(result.IsMatch);
            _matchRepo.Verify(r => r.AddAsync(It.IsAny<UserMatch>()), Times.Never);
        }

        // Karşılıklı Like → match kaydı oluşmalı ve IsMatch=true dönmeli.
        [Fact]
        public async Task SwipeAsync_MutualLike_MatchCreated()
        {
            var sender = MakeUser("user1");
            var receiver = MakeUser("user2");
            var reciprocalSwipe = new UserSwipe { SenderId = "user2", ReceiverId = "user1", SwipeType = SwipeType.Like };

            _swipeRepo.Setup(r => r.HasSwipedAsync("user1", "user2")).ReturnsAsync(false);
            _userRepo.Setup(r => r.GetUserWithProfileAsync("user2", true)).ReturnsAsync(receiver);
            _swipeRepo.Setup(r => r.GetReciprocalPositiveSwipeAsync("user1", "user2")).ReturnsAsync(reciprocalSwipe);
            _userRepo.Setup(r => r.GetUserWithProfileAsync("user1", true)).ReturnsAsync(sender);

            var result = await _sut.SwipeAsync("user1", Req("user2", "Like"));

            Assert.True(result.IsMatch);
            Assert.Equal("user2", result.MatchedUserId);
            // AddAsync tam 1 kez çağrılmalı — fazla match oluşmamalı.
            _matchRepo.Verify(r => r.AddAsync(It.IsAny<UserMatch>()), Times.Once);
        }

        // Match oluşunca her iki tarafın MatchesCount +1 artmalı.
        [Fact]
        public async Task SwipeAsync_MutualLike_MatchCountsIncremented()
        {
            var sender = MakeUser("user1");
            var receiver = MakeUser("user2");
            var reciprocalSwipe = new UserSwipe { SenderId = "user2", ReceiverId = "user1", SwipeType = SwipeType.Like };

            _swipeRepo.Setup(r => r.HasSwipedAsync("user1", "user2")).ReturnsAsync(false);
            _userRepo.Setup(r => r.GetUserWithProfileAsync("user2", true)).ReturnsAsync(receiver);
            _swipeRepo.Setup(r => r.GetReciprocalPositiveSwipeAsync("user1", "user2")).ReturnsAsync(reciprocalSwipe);
            _userRepo.Setup(r => r.GetUserWithProfileAsync("user1", true)).ReturnsAsync(sender);

            await _sut.SwipeAsync("user1", Req("user2", "Like"));

            Assert.Equal(1, sender.Profile!.MatchesCount);
            Assert.Equal(1, receiver.Profile!.MatchesCount);
        }
    }
}
