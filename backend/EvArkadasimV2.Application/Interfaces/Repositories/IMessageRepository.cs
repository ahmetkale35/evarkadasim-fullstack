using EvArkadasimV2.Domain.Entities;

namespace EvArkadasimV2.Application.Interfaces.Repositories
{
    public interface IMessageRepository : IGenericRepository<Message>
    {
        // Bir match'e ait mesajları gönderim sırasına göre döner.
        Task<List<Message>> GetByMatchIdAsync(int matchId);

        // Karşı tarafın gönderdiği okunmamış mesajları toplu okundu işaretler.
        Task MarkAsReadAsync(int matchId, string currentUserId);
    }
}
