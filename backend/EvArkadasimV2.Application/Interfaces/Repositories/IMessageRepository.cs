using EvArkadasimV2.Domain.Entities;

namespace EvArkadasimV2.Application.Interfaces.Repositories
{
    public interface IMessageRepository : IGenericRepository<Message>
    {
        // Bir match'e ait mesajları sayfalı döner. Tuple: sayfa içeriği + toplam kayıt sayısı.
        // Toplam sayı HasMore hesabı ve frontend için aynı sorguda çekilir; iki ayrı round-trip önlenir.
        Task<(List<Message> Messages, int TotalCount)> GetByMatchIdAsync(int matchId, int page, int pageSize);

        // Karşı tarafın gönderdiği okunmamış mesajları toplu okundu işaretler.
        Task MarkAsReadAsync(int matchId, string currentUserId);
    }
}
