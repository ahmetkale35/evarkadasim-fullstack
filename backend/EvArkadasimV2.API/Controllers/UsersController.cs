using EvArkadasimV2.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvArkadasimV2.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IFeedService _feedService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(IFeedService feedService, ILogger<UsersController> logger)
        {
            _feedService = feedService;
            _logger = logger;
        }

        // GET: api/users?skip=0&take=20
        // Swipe için aday kullanıcı listesini döndürür.
        // Kendisi ve daha önce swipe attığı kullanıcılar listede yer almaz.
        [HttpGet]
        public async Task<IActionResult> GetFeed([FromQuery] int skip = 0, [FromQuery] int take = 20)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            try
            {
                var feed = await _feedService.GetFeedAsync(userId, skip, take);
                return Ok(feed);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetFeed sırasında beklenmedik hata. UserId: {UserId}", userId);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }
    }
}
