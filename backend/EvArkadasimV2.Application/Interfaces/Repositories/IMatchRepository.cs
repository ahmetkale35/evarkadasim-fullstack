using EvArkadasimV2.Domain.Entities;

namespace EvArkadasimV2.Application.Interfaces.Repositories
{
    // UserMatch için EFCore async sorgularını Application katmanından soyutlar.
    // Application projesi EFCore referansı içermediği için ToListAsync gibi metotları
    // doğrudan kullanamaz; bu yüzden materialize eden sorgular Infrastructure'a taşındı.
    public interface IMatchRepository : IGenericRepository<UserMatch>
    {
        // Kullanıcının User1 veya User2 olarak yer aldığı tüm match'leri döner.
        // Include(User1) ve Include(User2): match listesinde "karşı tarafın adı"nı
        // gösterebilmek için Name alanına ihtiyacımız var → ek sorgu (N+1) yapmamak adına eager load.
        Task<List<UserMatch>> GetMatchesForUserAsync(string userId);
    }
}
