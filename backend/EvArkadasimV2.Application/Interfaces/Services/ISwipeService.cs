using EvArkadasimV2.Application.DTOs.User;

namespace EvArkadasimV2.Application.Interfaces.Services
{
    public interface ISwipeService
    {
        // Sender'ın receiver için yaptığı swipe'ı (Like/Pass/SuperLike) işler;
        // gerekirse karşılıklı eşleşme yaratır ve sonucu döner.
        Task<SwipeResultDto> SwipeAsync(string senderId, SwipeRequestDto request);

        // Kullanıcının dahil olduğu tüm eşleşmeleri (User1 veya User2 olarak) tarih
        // sırasında en yeniden eskiye listeler.
        Task<IReadOnlyList<MatchDto>> GetMyMatchesAsync(string userId);

        // Kullanıcının Pass swipe'larını siler, feed cache'ini temizler ve silinen sayıyı döner.
        Task<int> ResetFeedAsync(string userId);
    }
}
