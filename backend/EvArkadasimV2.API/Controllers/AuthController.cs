using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EvArkadasimV2.Application.DTOs.Auth;
using EvArkadasimV2.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EvArkadasimV2.API.Controllers
{
    /// <summary>Kullanıcı kayıt, giriş, token yenileme ve çıkış işlemleri.</summary>
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>Yeni kullanıcı kaydı oluşturur ve JWT + refresh token döner.</summary>
        /// <param name="request">E-posta, şifre ve ad bilgileri.</param>
        [HttpPost("register")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            var response = await _authService.RegisterAsync(request);
            return CreatedAtAction(nameof(Register), response);
        }

        /// <summary>Kullanıcı girişi yapar ve JWT + refresh token döner.</summary>
        /// <param name="request">E-posta ve şifre.</param>
        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }

        /// <summary>Geçerli bir refresh token ile yeni access + refresh token çifti üretir.</summary>
        /// <param name="request">Refresh token.</param>
        [HttpPost("refresh")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto request)
        {
            var response = await _authService.RefreshTokenAsync(request.RefreshToken);
            return Ok(response);
        }

        /// <summary>Mevcut access token ve refresh token'ı iptal ederek çıkış yapar.</summary>
        /// <param name="refreshToken">İptal edilecek refresh token (opsiyonel).</param>
        [HttpPost("logout")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Logout(
            [FromHeader(Name = "X-Refresh-Token")] string? refreshToken)
        {
            var jti = User.FindFirstValue(JwtRegisteredClaimNames.Jti);
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // exp claim Unix timestamp (saniye) olarak gelir; DateTime'a çevrilir.
            var expClaim = User.FindFirstValue(JwtRegisteredClaimNames.Exp);
            var tokenExpiresAt = expClaim != null
                ? DateTimeOffset.FromUnixTimeSeconds(long.Parse(expClaim)).UtcDateTime
                : DateTime.UtcNow;

            await _authService.LogoutAsync(jti!, userId!, tokenExpiresAt, refreshToken);
            return NoContent();
        }
    }
}
