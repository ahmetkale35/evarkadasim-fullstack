using EvArkadasimV2.Application.DTOs.User;
using EvArkadasimV2.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvArkadasimV2.API.Controllers
{
    /// <summary>Swipe akışı (feed) yönetimi.</summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [Produces("application/json")]
    public class UsersController : ControllerBase
    {
        private readonly IFeedService _feedService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(IFeedService feedService, ILogger<UsersController> logger)
        {
            _feedService = feedService;
            _logger = logger;
        }

        /// <summary>Swipe için aday kullanıcıları sayfalı listeler.</summary>
        /// <remarks>Giriş yapan kullanıcının kendisi ve daha önce swipe attığı kullanıcılar hariç tutulur.</remarks>
        /// <param name="skip">Atlanan kayıt sayısı (offset). Varsayılan: 0.</param>
        /// <param name="take">Döndürülecek kayıt sayısı. Varsayılan: 20.</param>
        [HttpGet]
        [ProducesResponseType(typeof(PagedFeedDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetFeed([FromQuery] int skip = 0, [FromQuery] int take = 20)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            try
            {
                var result = await _feedService.GetFeedAsync(userId, skip, take);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetFeed sırasında beklenmedik hata. UserId: {UserId}", userId);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }
    }
}
