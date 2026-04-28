using EvArkadasimV2.Application.DTOs.Auth;
using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace EvArkadasimV2.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("register")]
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

        [HttpPost("login")]
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
