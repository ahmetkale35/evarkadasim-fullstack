using EvArkadasimV2.Application.DTOs.User;
using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvArkadasimV2.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SwipeController : ControllerBase
    {
        private readonly ISwipeService _swipeService;
        private readonly ILogger<SwipeController> _logger;

        public SwipeController(ISwipeService swipeService, ILogger<SwipeController> logger)
        {
            _swipeService = swipeService;
            _logger = logger;
        }

        // GET: api/swipe/matches
        // Giriş yapmış kullanıcının dahil olduğu tüm eşleşmeleri en yeniden eskiye listeler.
        [HttpGet("matches")]
        public async Task<IActionResult> GetMyMatches()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            try
            {
                var matches = await _swipeService.GetMyMatchesAsync(userId);
                return Ok(matches);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetMyMatches sırasında beklenmedik hata. UserId: {UserId}", userId);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }

        // POST: api/swipe
        // Sender'ın receiver için yaptığı swipe işlemini kaydeder.
        // Eşleşme oluştuysa SwipeResultDto.IsMatch=true ile döner.
        [HttpPost]
        public async Task<IActionResult> Swipe([FromBody] SwipeRequestDto request)
        {
            // [Authorize] pipeline'dan geçen istekler için NameIdentifier claim'i garantilidir.
            // Sender'ı body'den almıyoruz: kullanıcının başkasının adına swipe atmasını engellemek için
            // sender her zaman token'dan çıkarılır (yetkilendirme ile kimlik tutarlılığı sağlanır).
            var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            try
            {
                var result = await _swipeService.SwipeAsync(senderId, request);
                return Ok(result);
            }
            catch (DomainException ex)
            {
                // İş kuralı ihlalleri (kendine swipe, geçersiz tip, mükerrer swipe) → 400.
                return BadRequest(new { ex.Message });
            }
            catch (NotFoundException ex)
            {
                // Receiver veya sender profili bulunamadıysa → 404.
                return NotFound(new { ex.Message });
            }
            catch (Exception ex)
            {
                // Beklenmedik hatalar: stack trace client'a sızdırılmaz, log'a yazılır.
                _logger.LogError(ex, "Swipe sırasında beklenmedik hata. SenderId: {SenderId}, ReceiverId: {ReceiverId}",
                    senderId, request.ReceiverId);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }
    }
}
