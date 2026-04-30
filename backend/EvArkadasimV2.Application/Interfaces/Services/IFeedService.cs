using EvArkadasimV2.Application.DTOs.User;

namespace EvArkadasimV2.Application.Interfaces.Services
{
    public interface IFeedService
    {
        // Belirli bir kullanıcı için swipe edilebilecek aday listesini döner.
        // Kendisi ve daha önce swipe attığı kullanıcılar listede yer almaz.
        // Sıralama: önce bu kullanıcıya Like/SuperLike atanlar, sonra LastActive DESC.
        Task<PagedFeedDto> GetFeedAsync(string currentUserId, int skip, int take);
    }
}
