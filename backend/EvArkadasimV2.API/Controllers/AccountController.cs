using System.Security.Claims;
using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EvArkadasimV2.API.Controllers
{
    /// <summary>Hesap yönetimi endpoint'leri.</summary>
    [ApiController]
    [Route("api/account")]
    [Authorize]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly AppDbContext _db;

        public AccountController(UserManager<AppUser> userManager, AppDbContext db)
        {
            _userManager = userManager;
            _db = db;
        }

        /// <summary>
        /// Hesabı kalıcı olarak siler. KVKK gereği tüm kişisel veriler silinir.
        /// Swipe ve match geçmişi, mesajlar, profil ve kimlik bilgileri kaldırılır.
        /// </summary>
        [HttpDelete("me")]
        public async Task<IActionResult> DeleteAccount()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            await using var transaction = await _db.Database.BeginTransactionAsync();

            // RESTRICT FK'lar nedeniyle önce bağımlı kayıtlar silinmeli.
            await _db.UserSwipes
                .Where(s => s.SenderId == userId || s.ReceiverId == userId)
                .ExecuteDeleteAsync();

            // Mesajlar UserMatch → Cascade ile silinir.
            await _db.UserMatches
                .Where(m => m.User1Id == userId || m.User2Id == userId)
                .ExecuteDeleteAsync();

            // Profile, RefreshTokens, RevokedTokens → AppUser üzerinden Cascade ile silinir.
            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Hesap silinemedi." });
            }

            await transaction.CommitAsync();
            return NoContent();
        }
    }
}
