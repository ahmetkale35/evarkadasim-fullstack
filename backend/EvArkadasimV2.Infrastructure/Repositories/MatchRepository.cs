using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EvArkadasimV2.Infrastructure.Repositories
{
    public class MatchRepository : GenericRepository<UserMatch>, IMatchRepository
    {
        public MatchRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<List<UserMatch>> GetMatchesForUserAsync(string userId)
        {
            // AsNoTracking: salt okuma listesi, change-tracker yükü gereksiz.
            // Include(User1/User2): client'a karşı tarafın adı dönüleceği için eager load
            // (lazy load + N+1 sorgu sayısı patlaması yerine tek JOIN ile çekilir).
            return await _dbSet
                .AsNoTracking()
                .Include(m => m.User1).ThenInclude(u => u.Profile)
                .Include(m => m.User2).ThenInclude(u => u.Profile)
                .Where(m => m.User1Id == userId || m.User2Id == userId)
                .OrderByDescending(m => m.MatchedAt)
                .ToListAsync();
        }
    }
}
