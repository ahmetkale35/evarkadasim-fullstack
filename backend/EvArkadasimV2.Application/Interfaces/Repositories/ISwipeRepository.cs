using EvArkadasimV2.Domain.Entities;

namespace EvArkadasimV2.Application.Interfaces.Repositories
{
    // UserSwipe varlığına özgü, EFCore'a (Application katmanından gizlenmiş)
    // doğrudan async sorgu yapan yardımcı metotları barındırır.
    // Application katmanı EFCore'u referans almadığı için AnyAsync/FirstOrDefaultAsync
    // çağrıları doğrudan kullanılamaz; bu yüzden bu sorgular Infrastructure'a taşındı.
    public interface ISwipeRepository : IGenericRepository<UserSwipe>
    {
        // Aynı yönde (sender → receiver) bir swipe'ın daha önce yapılıp yapılmadığını döner.
        // Idempotency koruması ve istatistik çift sayımının önlenmesi için kullanılır.
        Task<bool> HasSwipedAsync(string senderId, string receiverId);

        // Karşı tarafın daha önce sender'a Like/SuperLike (Pass hariç) atıp atmadığını
        // kontrol eder. Match koşulu: iki tarafın da pozitif niyetli olması.
        Task<UserSwipe?> GetReciprocalPositiveSwipeAsync(string senderId, string receiverId);

        // Kullanıcının attığı tüm Pass swipe'larını siler ve silinen satır sayısını döner.
        // Like/SuperLike'a dokunulmaz — match mantığı korunur.
        Task<int> DeletePassSwipesAsync(string userId);
    }
}
