using EvArkadasimV2.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Claims;

namespace EvArkadasimV2.API.Middleware
{
    public class LastActiveMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;

        public LastActiveMiddleware(RequestDelegate next, IMemoryCache cache)
        {
            _next = next;
            _cache = cache;
        }

        public async Task InvokeAsync(HttpContext context, IServiceScopeFactory scopeFactory)
        {
            var userId = context.User.Identity?.IsAuthenticated == true
                ? context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                : null;

            await _next(context);

            if (userId is null) return;
            var key = $"la:{userId}";
            if (_cache.TryGetValue(key, out _)) return;

            _cache.Set(key, true, TimeSpan.FromMinutes(15));
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    await db.UserProfiles
                        .Where(p => p.AppUserId == userId)
                        .ExecuteUpdateAsync(s => s.SetProperty(p => p.LastActive, DateTime.UtcNow));
                }
                catch { /* fire & forget — DB hatası isteği bloklamaz */ }
            });
        }
    }
}
