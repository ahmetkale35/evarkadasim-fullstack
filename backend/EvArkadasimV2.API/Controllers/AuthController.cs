using EvArkadasimV2.Application.DTOs.Auth;
using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace EvArkadasimV2.API.Controllers
{
    /// <summary>Kullanıcı kayıt ve giriş işlemleri.</summary>
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        /// <summary>Yeni kullanıcı kaydı oluşturur ve JWT token döner.</summary>
        /// <param name="request">E-posta, şifre ve ad bilgileri.</param>
        [HttpPost("register")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            try
            {
                var response = await _authService.RegisterAsync(request);
                return CreatedAtAction(nameof(Register), response);
            }
            catch (DomainException ex)
            {
                return BadRequest(new { ex.Message });
            }
            catch (Exception ex)
            {
                // Beklenmedik hatalar: stack trace client'a sızdırılmaz, log'a yazılır.
                _logger.LogError(ex, "Register sırasında beklenmedik hata. Email: {Email}", request.Email);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }

        /// <summary>Kullanıcı girişi yapar ve JWT token döner.</summary>
        /// <param name="request">E-posta ve şifre.</param>
        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            try
            {
                var response = await _authService.LoginAsync(request);
                return Ok(response);
            }
            catch (DomainException ex)
            {
                return Unauthorized(new { ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Login sırasında beklenmedik hata.");
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }
    }
}
