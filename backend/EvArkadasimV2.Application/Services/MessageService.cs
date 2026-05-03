using EvArkadasimV2.Application.DTOs.Chat;
using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Domain.Enums;
using System.Net;

namespace EvArkadasimV2.Application.Services
{
    public class MessageService : IMessageService
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IMatchRepository _matchRepository;

        public MessageService(IMessageRepository messageRepository, IMatchRepository matchRepository)
        {
            _messageRepository = messageRepository;
            _matchRepository = matchRepository;
        }

        public async Task<PagedMessagesDto> GetMessagesAsync(int matchId, string currentUserId, int page, int pageSize)
        {
            await AuthorizeMatchAccessAsync(matchId, currentUserId);

            var (messages, totalCount) = await _messageRepository.GetByMatchIdAsync(matchId, page, pageSize);

            return new PagedMessagesDto
            {
                Messages = messages.Select(MapToDto).ToList(),
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                HasMore = page * pageSize < totalCount
            };
        }

        public async Task<MessageDto> SendMessageAsync(SendMessageDto dto, string senderId)
        {
            await AuthorizeMatchAccessAsync(dto.MatchId, senderId);

            // DTO'dan gelen string türü enum'a çevir.
            // Validation zaten "text|image|gif" zorunluluğu koydu; TryParse başarısız olursa Text'e düş.
            if (!Enum.TryParse<MessageType>(dto.Type, ignoreCase: true, out var messageType))
                messageType = MessageType.Text;

            var message = new Message
            {
                UserMatchId = dto.MatchId,
                SenderId = senderId,
                Content = WebUtility.HtmlEncode(dto.Content),
                Timestamp = DateTime.UtcNow,
                Type = messageType,
                IsRead = false
            };

            await _messageRepository.AddAsync(message);
            await _messageRepository.SaveChangesAsync();

            return MapToDto(message);
        }

        public async Task MarkAsReadAsync(int matchId, string currentUserId)
        {
            await AuthorizeMatchAccessAsync(matchId, currentUserId);
            await _messageRepository.MarkAsReadAsync(matchId, currentUserId);
        }

        // Kullanıcının bu match'e dahil olup olmadığını kontrol eder.
        // Her üç public metot aynı kontrole ihtiyaç duyduğu için private metoda çıkarıldı.
        private async Task AuthorizeMatchAccessAsync(int matchId, string userId)
        {
            var match = await _matchRepository.GetByIdAsync(matchId);

            if (match == null)
                throw new NotFoundException($"Eşleşme bulunamadı. Id: {matchId}");

            // User1 veya User2 olmayan biri başkasının sohbetine erişmeye çalışıyor.
            if (match.User1Id != userId && match.User2Id != userId)
                throw new ForbiddenException("Bu sohbete erişim yetkiniz yok.");
        }

        private static MessageDto MapToDto(Message m) => new()
        {
            Id = m.Id,
            SenderId = m.SenderId,
            Content = m.Content,
            Timestamp = m.Timestamp,
            // Enum → lowercase string: frontend "text"/"image"/"gif" bekliyor, C# enum "Text"/"Image"/"Gif" üretir.
            Type = m.Type.ToString().ToLower(),
            IsRead = m.IsRead
        };
    }
}
