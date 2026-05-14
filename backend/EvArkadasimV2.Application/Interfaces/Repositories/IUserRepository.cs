using EvArkadasimV2.Domain.Entities;

namespace EvArkadasimV2.Application.Interfaces.Repositories
{
    // Bu arayüz, AppUser varlığına özgü ek veri erişim yöntemlerini tanımlar. IGenericRepository<AppUser> arayüzünden türetilmiştir, bu nedenle temel CRUD işlemlerini de içerir.
    public interface IUserRepository : IGenericRepository<AppUser>
    {
        // GÜNCELLEME: tracking parametresi eklendi
        Task<AppUser?> GetUserWithProfileAsync(string userId, bool tracking = true);
        Task<AppUser?> GetUserByEmailAsync(string email, bool tracking = true);

        // Tüm adayları LikeWeight bilgisiyle döndürür. LikeWeight: 0=yok, 1=Like, 2=SuperLike.
        // Sayfalama ve ağırlıklı sıralama FeedService'de yapılır.
        Task<List<(AppUser User, int LikeWeight)>> GetFeedCandidatesWithLikeStatusAsync(string currentUserId);
    }
}