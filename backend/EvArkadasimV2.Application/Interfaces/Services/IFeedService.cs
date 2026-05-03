using EvArkadasimV2.Application.DTOs.User;

namespace EvArkadasimV2.Application.Interfaces.Services
{
    public interface IFeedService
    {
        // Önce bu kullanıcıya Like/SuperLike atanlar, sonra LastActive DESC. Daha önce swipe edilenler hariç.
        Task<PagedFeedDto> GetFeedAsync(string currentUserId, int skip, int take);
    }
}
