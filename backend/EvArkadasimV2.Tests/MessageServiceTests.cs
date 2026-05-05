using EvArkadasimV2.Application.DTOs.Chat;
using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Application.Services;
using EvArkadasimV2.Domain.Entities;
using Moq;
using Xunit;

namespace EvArkadasimV2.Tests
{
    // MessageService: mesaj gönderme, listeleme ve okundu işaretlemeyi test eder.
    // Her üç metot AuthorizeMatchAccess kullandığı için yetki kontrolleri ayrı ayrı doğrulanır.
    public class MessageServiceTests
    {
        private readonly Mock<IMessageRepository> _messageRepo = new();
        private readonly Mock<IMatchRepository> _matchRepo = new();
        private readonly Mock<INotificationService> _notifications = new();
        private readonly MessageService _sut;

        public MessageServiceTests()
        {
            _notifications.Setup(n => n.SendMessageAsync(It.IsAny<string>(), It.IsAny<MessageDto>()))
                          .Returns(Task.CompletedTask);
            _messageRepo.Setup(r => r.SaveChangesAsync()).ReturnsAsync(true);
            _sut = new MessageService(_messageRepo.Object, _matchRepo.Object, _notifications.Object);
        }

        private static UserMatch MakeMatch(int id, string u1, string u2) => new()
        {
            Id = id, User1Id = u1, User2Id = u2
        };

        private static SendMessageDto MsgDto(int matchId, string content = "Merhaba", string type = "text") =>
            new() { MatchId = matchId, Content = content, Type = type };

        // --- GetMessagesAsync ---

        // Match bulunamazsa → NotFoundException.
        [Fact]
        public async Task GetMessagesAsync_MatchNotFound_ThrowsNotFoundException()
        {
            _matchRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((UserMatch?)null);

            await Assert.ThrowsAsync<NotFoundException>(() =>
                _sut.GetMessagesAsync(99, "user1", 1, 20));
        }

        // Kullanıcı match'in parçası değilse → ForbiddenException.
        [Fact]
        public async Task GetMessagesAsync_UserNotInMatch_ThrowsForbiddenException()
        {
            _matchRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(MakeMatch(1, "user1", "user2"));

            await Assert.ThrowsAsync<ForbiddenException>(() =>
                _sut.GetMessagesAsync(1, "outsider", 1, 20));
        }

        // Geçerli istek → doğru sayfalama meta verisi dönmeli.
        [Fact]
        public async Task GetMessagesAsync_ValidRequest_ReturnsPaged()
        {
            var messages = Enumerable.Range(1, 5)
                .Select(i => new Message { Id = i, SenderId = "user1", Content = $"msg{i}", Type = Domain.Enums.MessageType.Text })
                .ToList();

            _matchRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(MakeMatch(1, "user1", "user2"));
            _messageRepo.Setup(r => r.GetByMatchIdAsync(1, 1, 20)).ReturnsAsync((messages, 5));

            var result = await _sut.GetMessagesAsync(1, "user1", 1, 20);

            Assert.Equal(5, result.TotalCount);
            Assert.Equal(5, result.Messages.Count);
            Assert.False(result.HasMore);
        }

        // --- SendMessageAsync ---

        // Match yoksa → NotFoundException.
        [Fact]
        public async Task SendMessageAsync_MatchNotFound_ThrowsNotFoundException()
        {
            _matchRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((UserMatch?)null);

            await Assert.ThrowsAsync<NotFoundException>(() =>
                _sut.SendMessageAsync(MsgDto(99), "user1"));
        }

        // Yetkisiz kullanıcı → ForbiddenException.
        [Fact]
        public async Task SendMessageAsync_UserNotInMatch_ThrowsForbiddenException()
        {
            _matchRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(MakeMatch(1, "user1", "user2"));

            await Assert.ThrowsAsync<ForbiddenException>(() =>
                _sut.SendMessageAsync(MsgDto(1), "outsider"));
        }

        // Geçerli mesaj → repository'e eklenmeli, SaveChanges çağrılmalı.
        [Fact]
        public async Task SendMessageAsync_ValidMessage_SavedToRepository()
        {
            _matchRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(MakeMatch(1, "user1", "user2"));

            await _sut.SendMessageAsync(MsgDto(1), "user1");

            _messageRepo.Verify(r => r.AddAsync(It.IsAny<Message>()), Times.Once);
            _messageRepo.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        // Geçerli mesaj → alıcıya SignalR bildirimi gitmeli.
        [Fact]
        public async Task SendMessageAsync_ValidMessage_NotificationSentToRecipient()
        {
            _matchRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(MakeMatch(1, "user1", "user2"));

            await _sut.SendMessageAsync(MsgDto(1), "user1");

            // user1 gönderdi → alıcı user2 olmalı.
            _notifications.Verify(n =>
                n.SendMessageAsync("user2", It.IsAny<MessageDto>()), Times.Once);
        }

        // User2 gönderirse alıcı user1 olmalı (karşılıklı yön kontrolü).
        [Fact]
        public async Task SendMessageAsync_SentByUser2_NotificationGoesToUser1()
        {
            _matchRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(MakeMatch(1, "user1", "user2"));

            await _sut.SendMessageAsync(MsgDto(1), "user2");

            _notifications.Verify(n =>
                n.SendMessageAsync("user1", It.IsAny<MessageDto>()), Times.Once);
        }

        // XSS koruması: HTML özel karakterleri encode edilmeli.
        [Fact]
        public async Task SendMessageAsync_HtmlContent_IsEncoded()
        {
            _matchRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(MakeMatch(1, "user1", "user2"));

            Message? saved = null;
            _messageRepo.Setup(r => r.AddAsync(It.IsAny<Message>()))
                        .Callback<Message>(m => saved = m)
                        .Returns(Task.CompletedTask);

            await _sut.SendMessageAsync(MsgDto(1, "<script>alert('xss')</script>"), "user1");

            Assert.NotNull(saved);
            Assert.DoesNotContain("<script>", saved!.Content);
        }

        // Tanımsız mesaj tipi → exception yerine Text'e düşmeli.
        [Fact]
        public async Task SendMessageAsync_InvalidType_DefaultsToText()
        {
            _matchRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(MakeMatch(1, "user1", "user2"));

            Message? saved = null;
            _messageRepo.Setup(r => r.AddAsync(It.IsAny<Message>()))
                        .Callback<Message>(m => saved = m)
                        .Returns(Task.CompletedTask);

            await _sut.SendMessageAsync(MsgDto(1, "Merhaba", "InvalidType"), "user1");

            Assert.Equal(Domain.Enums.MessageType.Text, saved!.Type);
        }

        // --- MarkAsReadAsync ---

        // Match yoksa → NotFoundException.
        [Fact]
        public async Task MarkAsReadAsync_MatchNotFound_ThrowsNotFoundException()
        {
            _matchRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((UserMatch?)null);

            await Assert.ThrowsAsync<NotFoundException>(() =>
                _sut.MarkAsReadAsync(99, "user1"));
        }

        // Yetkisiz kullanıcı → ForbiddenException.
        [Fact]
        public async Task MarkAsReadAsync_UserNotInMatch_ThrowsForbiddenException()
        {
            _matchRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(MakeMatch(1, "user1", "user2"));

            await Assert.ThrowsAsync<ForbiddenException>(() =>
                _sut.MarkAsReadAsync(1, "outsider"));
        }

        // Geçerli istek → repository'nin MarkAsRead metodu çağrılmalı.
        [Fact]
        public async Task MarkAsReadAsync_ValidRequest_CallsRepository()
        {
            _matchRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(MakeMatch(1, "user1", "user2"));
            _messageRepo.Setup(r => r.MarkAsReadAsync(1, "user1")).Returns(Task.CompletedTask);

            await _sut.MarkAsReadAsync(1, "user1");

            _messageRepo.Verify(r => r.MarkAsReadAsync(1, "user1"), Times.Once);
        }
    }
}
