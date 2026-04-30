using EvArkadasimV2.Application.DTOs.User;
using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvArkadasimV2.API.Controllers
{
    /// <summary>Kullanıcı profili yönetimi.</summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [Produces("application/json")]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;
        private readonly ILogger<ProfileController> _logger;

        public ProfileController(IProfileService profileService, ILogger<ProfileController> logger)
        {
            _profileService = profileService;
            _logger = logger;
        }

        /// <summary>Giriş yapan kullanıcının profilini döner.</summary>
        [HttpGet]
        [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetMyProfile()
        {
            // [Authorize] pipeline'dan geçen her istek için userId garantilidir.
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            try
            {
                var profile = await _profileService.GetProfileAsync(userId);
                return Ok(profile);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetMyProfile sırasında beklenmedik hata. UserId: {UserId}", userId);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }

        /// <summary>Giriş yapan kullanıcının profilini günceller.</summary>
        /// <remarks>Partial update semantiği: yalnızca gönderilen alanlar değişir, null gönderilmeyenler korunur.</remarks>
        [HttpPut]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileDto updateDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            try
            {
                await _profileService.UpdateProfileAsync(userId, updateDto);
                return Ok(new { Message = "Profil başarıyla güncellendi." });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { ex.Message });
            }
            catch (DomainException ex)
            {
                return BadRequest(new { ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "UpdateMyProfile sırasında beklenmedik hata. UserId: {UserId}", userId);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }
    }
}
