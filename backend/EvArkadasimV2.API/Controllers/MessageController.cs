using EvArkadasimV2.Application.DTOs.Chat;
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
    public class MessageController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly ILogger<MessageController> _logger;

        public MessageController(IMessageService messageService, ILogger<MessageController> logger)
        {
            _messageService = messageService;
            _logger = logger;
        }

        // GET: api/message/{matchId}
        // Bir match'e ait tüm mesajları kronolojik sırayla döner.
        [HttpGet("{matchId}")]
        public async Task<IActionResult> GetMessages(int matchId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            try
            {
                var messages = await _messageService.GetMessagesAsync(matchId, currentUserId);
                return Ok(messages);
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

        // POST: api/message
        // Yeni mesaj gönderir. Body: { matchId, content, type }
        [HttpPost]
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

        // PUT: api/message/{matchId}/read
        // Karşı tarafın okunmamış mesajlarını okundu olarak işaretler. 204 döner.
        [HttpPut("{matchId}/read")]
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
