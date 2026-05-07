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

        public UsersController(IFeedService feedService)
        {
            _feedService = feedService;
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
            var result = await _feedService.GetFeedAsync(userId, skip, take);
            return Ok(result);
        }

        /// <summary>Belirli bir kullanıcının profilini ve uyumluluk skorunu döndürür.</summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(UserSummaryDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetById(string id)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await _feedService.GetUserByIdAsync(currentUserId, id);
            if (result is null) return NotFound();
            return Ok(result);
        }
    }
}
