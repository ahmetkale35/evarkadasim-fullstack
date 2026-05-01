using EvArkadasimV2.Application.DTOs.Auth;
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

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>Yeni kullanıcı kaydı oluşturur ve JWT token döner.</summary>
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

        /// <summary>Kullanıcı girişi yapar ve JWT token döner.</summary>
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
    }
}
