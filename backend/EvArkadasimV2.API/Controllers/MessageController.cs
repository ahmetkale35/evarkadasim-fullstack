using EvArkadasimV2.Application.DTOs.Chat;
using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvArkadasimV2.API.Controllers
{
    /// <summary>Eşleşmeler üzerinden mesajlaşma.</summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [Produces("application/json")]
    public class MessageController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly ILogger<MessageController> _logger;

        public MessageController(IMessageService messageService, ILogger<MessageController> logger)
        {
            _messageService = messageService;
            _logger = logger;
        }

        /// <summary>Bir eşleşmeye ait mesajları kronolojik sırayla sayfalı döner.</summary>
        /// <remarks>Yalnızca eşleşmeye dahil kullanıcılar erişebilir; aksi hâlde 403 döner.</remarks>
        /// <param name="matchId">Eşleşme ID'si.</param>
        /// <param name="page">Sayfa numarası (1 tabanlı). Varsayılan: 1.</param>
        /// <param name="pageSize">Sayfa başı mesaj sayısı (1-100). Varsayılan: 50.</param>
        [HttpGet("{matchId}")]
        [ProducesResponseType(typeof(PagedMessagesDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetMessages(int matchId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 50;

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            try
            {
                var result = await _messageService.GetMessagesAsync(matchId, currentUserId, page, pageSize);
                return Ok(result);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (DomainException)
            {
                // Kullanıcı bu match'e dahil değil — 403 dön, detay verme.
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetMessages sırasında beklenmedik hata. MatchId: {MatchId}", matchId);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }

        /// <summary>Eşleşme üzerinden yeni mesaj gönderir.</summary>
        [HttpPost]
        [ProducesResponseType(typeof(MessageDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Send([FromBody] SendMessageDto dto)
        {
            var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            try
            {
                var message = await _messageService.SendMessageAsync(dto, senderId);
                return CreatedAtAction(nameof(GetMessages), new { matchId = dto.MatchId }, message);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (DomainException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Send sırasında beklenmedik hata. MatchId: {MatchId}", dto.MatchId);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }

        /// <summary>Karşı tarafın okunmamış mesajlarını okundu olarak işaretler.</summary>
        /// <param name="matchId">Eşleşme ID'si.</param>
        [HttpPut("{matchId}/read")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> MarkAsRead(int matchId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            try
            {
                await _messageService.MarkAsReadAsync(matchId, currentUserId);
                return NoContent();
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (DomainException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "MarkAsRead sırasında beklenmedik hata. MatchId: {MatchId}", matchId);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }
    }
}
