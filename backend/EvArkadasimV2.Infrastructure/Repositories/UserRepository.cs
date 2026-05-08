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

        public async Task<List<AppUser>> GetFeedCandidatesAsync(string currentUserId, int skip, int take)
        {
            return await _context.Users
                .AsNoTracking()
                .Include(u => u.Profile)
                .Where(u => u.Id != currentUserId)
                .Where(u => u.Profile != null)
                .Where(u => !_context.UserSwipes
                    .Any(s => s.SenderId == currentUserId && s.ReceiverId == u.Id))
                .OrderByDescending(u => _context.UserSwipes
                    .Any(s => s.SenderId == u.Id
                              && s.ReceiverId == currentUserId
                              && (s.SwipeType == SwipeType.Like || s.SwipeType == SwipeType.SuperLike)))
                .ThenByDescending(u => u.Profile.LastActive)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<List<(AppUser User, bool HasLikedCurrentUser)>> GetFeedCandidatesWithLikeStatusAsync(string currentUserId)
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

            var likedMeIds = new HashSet<string>(await _context.UserSwipes
                .AsNoTracking()
                .Where(s => s.ReceiverId == currentUserId &&
                            (s.SwipeType == SwipeType.Like || s.SwipeType == SwipeType.SuperLike))
                .Select(s => s.SenderId)
                .ToListAsync());

            return candidates
                .Select(u => (User: u, HasLikedCurrentUser: likedMeIds.Contains(u.Id)))
                .ToList();
        }
    }
}