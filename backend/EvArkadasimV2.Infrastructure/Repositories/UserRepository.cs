using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Domain.Enums;
using EvArkadasimV2.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EvArkadasimV2.Infrastructure.Repositories
{
    public class UserRepository : GenericRepository<AppUser>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<AppUser?> GetUserWithProfileAsync(string userId, bool tracking = true)
        {
            var query = _context.Users.Include(u => u.Profile).Include(u => u.Properties).AsQueryable();

            if (!tracking)
                query = query.AsNoTracking(); // Sadece profil görüntülenecekse hızlı çalışır

            return await query.FirstOrDefaultAsync(u => u.Id == userId);
        }

        public async Task<AppUser?> GetUserByEmailAsync(string email, bool tracking = true)
        {
            var query = _context.Users.Include(u => u.Profile).AsQueryable();

            if (!tracking)
                query = query.AsNoTracking();

            return await query.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<List<(AppUser User, int LikeWeight)>> GetFeedCandidatesWithLikeStatusAsync(string currentUserId)
        {
            var candidates = await _context.Users
                .AsNoTracking()
                .Include(u => u.Profile)
                .Include(u => u.Properties)
                .Where(u => u.Id != currentUserId)
                .Where(u => u.Profile != null)
                .Where(u => !_context.UserSwipes
                    .Any(s => s.SenderId == currentUserId && s.ReceiverId == u.Id))
                .ToListAsync();

            var incomingSwipes = await _context.UserSwipes
                .AsNoTracking()
                .Where(s => s.ReceiverId == currentUserId &&
                            (s.SwipeType == SwipeType.Like || s.SwipeType == SwipeType.SuperLike))
                .Select(s => new { s.SenderId, s.SwipeType })
                .ToListAsync();

            var weightLookup = incomingSwipes.ToDictionary(
                x => x.SenderId,
                x => x.SwipeType == SwipeType.SuperLike ? 2 : 1
            );

            return candidates
                .Select(u => (User: u, LikeWeight: weightLookup.GetValueOrDefault(u.Id, 0)))
                .ToList();
        }
    }
}