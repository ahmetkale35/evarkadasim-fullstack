using EvArkadasimV2.Application.DTOs.Chat;

namespace EvArkadasimV2.Application.Interfaces.Services
{
    public interface IMessageService
    {
        Task<PagedMessagesDto> GetMessagesAsync(int matchId, string currentUserId, int page, int pageSize);
        Task<MessageDto> SendMessageAsync(SendMessageDto dto, string senderId);
        Task MarkAsReadAsync(int matchId, string currentUserId);
    }
}
