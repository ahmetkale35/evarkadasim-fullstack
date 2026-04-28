using EvArkadasimV2.Domain.Entities;

namespace EvArkadasimV2.Application.Interfaces.Repositories
{
    // Bu arayüz, AppUser varlığına özgü ek veri erişim yöntemlerini tanımlar. IGenericRepository<AppUser> arayüzünden türetilmiştir, bu nedenle temel CRUD işlemlerini de içerir.
    public interface IUserRepository : IGenericRepository<AppUser>
    {
        // GÜNCELLEME: tracking parametresi eklendi
        Task<AppUser?> GetUserWithProfileAsync(string userId, bool tracking = true);
        Task<AppUser?> GetUserByEmailAsync(string email, bool tracking = true);

        // Feed adaylarını döndürür: kendisi ve swipe ettikleri hariç.
        // Sıralama: önce currentUser'a Like/SuperLike atanlar, sonra LastActive DESC.
        // Tracking kapalı — read-only sorgu, EF change-tracking maliyetinden kaçınılır.
        Task<List<AppUser>> GetFeedCandidatesAsync(string currentUserId, int skip, int take);

        // Compatibility sıralaması için: tüm adayları HasLikedCurrentUser bilgisiyle döndürür.
        // Sayfalama FeedService'de yapılır (compatibility hesaplandıktan sonra).
        Task<List<(AppUser User, bool HasLikedCurrentUser)>> GetFeedCandidatesWithLikeStatusAsync(string currentUserId);
    }
}