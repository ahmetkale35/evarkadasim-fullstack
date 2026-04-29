using EvArkadasimV2.Application.DTOs.Chat;

namespace EvArkadasimV2.Application.Interfaces.Services
{
    public interface IMessageService
    {
        // Bir match'e ait mesajları döner. Kullanıcı o match'e dahil değilse hata fırlatır.
        Task<List<MessageDto>> GetMessagesAsync(int matchId, string currentUserId);

        // Mesaj gönderir. Kullanıcı o match'e dahil değilse hata fırlatır.
        Task<MessageDto> SendMessageAsync(SendMessageDto dto, string senderId);

        // Karşı tarafın okunmamış mesajlarını toplu okundu işaretler.
        Task MarkAsReadAsync(int matchId, string currentUserId);
    }
}
