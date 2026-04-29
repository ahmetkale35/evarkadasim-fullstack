using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EvArkadasimV2.Infrastructure.Repositories
{
    public class MessageRepository : GenericRepository<Message>, IMessageRepository
    {
        public MessageRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<List<Message>> GetByMatchIdAsync(int matchId)
        {
            return await _dbSet
                .AsNoTracking()
                .Where(m => m.UserMatchId == matchId)
                .OrderBy(m => m.Timestamp)
                .ToListAsync();
        }

        public async Task MarkAsReadAsync(int matchId, string currentUserId)
        {
            // Karşı tarafın gönderdiği, henüz okunmamış mesajları çek.
            // AsNoTracking kullanmıyoruz — güncelleme yapacağız, EF change tracker gerekli.
            var unread = await _dbSet
                .Where(m => m.UserMatchId == matchId
                         && m.SenderId != currentUserId
                         && !m.IsRead)
                .ToListAsync();

            if (unread.Count == 0) return;

            foreach (var msg in unread)
                msg.IsRead = true;

            await _context.SaveChangesAsync();
        }
    }
}
