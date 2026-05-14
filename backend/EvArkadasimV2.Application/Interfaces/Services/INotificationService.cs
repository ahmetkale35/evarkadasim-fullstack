using EvArkadasimV2.Application.DTOs.Chat;

namespace EvArkadasimV2.Application.Interfaces.Services
{
    public interface INotificationService
    {
        Task SendMessageAsync(string recipientUserId, MessageDto message);
        Task SendMatchAsync(string userId1, MatchDto matchForUser1, string userId2, MatchDto matchForUser2);
    }
}
