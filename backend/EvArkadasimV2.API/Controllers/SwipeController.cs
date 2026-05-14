using EvArkadasimV2.Application.DTOs.User;
using EvArkadasimV2.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvArkadasimV2.API.Controllers
{
    /// <summary>Swipe ve eşleşme yönetimi.</summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [Produces("application/json")]
    public class SwipeController : ControllerBase
    {
        private readonly ISwipeService _swipeService;

        public SwipeController(ISwipeService swipeService)
        {
            _swipeService = swipeService;
        }

        /// <summary>Giriş yapan kullanıcının tüm eşleşmelerini en yeniden eskiye listeler.</summary>
        [HttpGet("matches")]
        [ProducesResponseType(typeof(List<MatchDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetMyMatches()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var matches = await _swipeService.GetMyMatchesAsync(userId);
            return Ok(matches);
        }

        /// <summary>Kullanıcının tüm Pass swipe'larını siler ve feed'i sıfırlar.</summary>
        [HttpDelete("passes")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> ResetFeed()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var deletedCount = await _swipeService.ResetFeedAsync(userId);
            return Ok(new { deletedCount });
        }

        /// <summary>Bir kullanıcıya Like veya Pass atar. Karşılıklı Like varsa eşleşme oluşur.</summary>
        /// <remarks>
        /// Gönderen her zaman JWT token'dan belirlenir; body'den alınmaz.
        /// Bu sayede kullanıcının başkası adına swipe atması engellenir.
        /// </remarks>
        [HttpPost]
        [ProducesResponseType(typeof(SwipeResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Swipe([FromBody] SwipeRequestDto request)
        {
            // Sender her zaman token'dan çıkarılır — kullanıcı başkası adına swipe atamaz.
            var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await _swipeService.SwipeAsync(senderId, request);
            return Ok(result);
        }
    }
}
