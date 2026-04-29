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
            // AsNoTracking: mesajları sadece okuyoruz, EF'in değişiklik takibi gereksiz → RAM tasarrufu.
            // OrderBy(Timestamp): sohbet ekranı mesajları kronolojik sıralar, DB'den sıralı gelmesi N+1 önler.
            return await _dbSet
                .AsNoTracking()
                .Where(m => m.UserMatchId == matchId)
                .OrderBy(m => m.Timestamp)
                .ToListAsync();
        }

        public async Task MarkAsReadAsync(int matchId, string currentUserId)
        {
            // AsNoTracking YOK — güncelleme yapacağız, EF change tracker satırları takip etmeli.
            // SenderId != currentUserId: kendi gönderdiğin mesajları "okundu" yapmak anlamsız,
            // sadece karşı tarafın mesajları işaretlenir.
            var unread = await _dbSet
                .Where(m => m.UserMatchId == matchId
                         && m.SenderId != currentUserId
                         && !m.IsRead)
                .ToListAsync();

            // Zaten okunmuşsa DB'ye gereksiz round-trip yapma.
            if (unread.Count == 0) return;

            foreach (var msg in unread)
                msg.IsRead = true;

            await _context.SaveChangesAsync();
        }
    }
}
