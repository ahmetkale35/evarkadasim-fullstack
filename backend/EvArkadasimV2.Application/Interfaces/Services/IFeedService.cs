using EvArkadasimV2.Application.DTOs.User;

namespace EvArkadasimV2.Application.Interfaces.Services
{
    public interface IFeedService
    {
        // Ağırlıklı sıralama: likeWeight×40 + compat×0.35 + activityDecay×15 + profileScore×10. Daha önce swipe edilenler hariç.
        Task<PagedFeedDto> GetFeedAsync(string currentUserId, int skip, int take);
        Task<UserSummaryDto?> GetUserByIdAsync(string currentUserId, string targetUserId);
    }
}
