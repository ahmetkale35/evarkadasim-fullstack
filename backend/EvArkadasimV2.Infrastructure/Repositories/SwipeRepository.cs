using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Domain.Enums;
using EvArkadasimV2.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EvArkadasimV2.Infrastructure.Repositories
{
    public class SwipeRepository : GenericRepository<UserSwipe>, ISwipeRepository
    {
        public SwipeRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<bool> HasSwipedAsync(string senderId, string receiverId)
        {
            // AsNoTracking: salt sorgu, change-tracker'a entity yüklemeye gerek yok.
            // AnyAsync veriyi materialize etmeden sadece varlık kontrolü yapar (EXISTS sorgusu).
            return await _dbSet
                .AsNoTracking()
                .AnyAsync(s => s.SenderId == senderId && s.ReceiverId == receiverId);
        }

        public async Task<UserSwipe?> GetReciprocalPositiveSwipeAsync(string senderId, string receiverId)
        {
            // "Karşı taraftan bana gelen" swipe: receiver=sender, sender=receiver şeklinde ters çevrilir.
            // Pass dışlanır çünkü match için iki tarafın da olumlu niyet beyan etmesi gerekir.
            return await _dbSet
                .AsNoTracking()
                .FirstOrDefaultAsync(s =>
                    s.SenderId == receiverId &&
                    s.ReceiverId == senderId &&
                    s.SwipeType != SwipeType.Pass);
        }
    }
}
