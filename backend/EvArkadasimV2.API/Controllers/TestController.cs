using EvArkadasimV2.Application.DTOs.Test;
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
    public class TestController : ControllerBase
    {
        private readonly ITestService _testService;
        private readonly ILogger<TestController> _logger;

        public TestController(ITestService testService, ILogger<TestController> logger)
        {
            _testService = testService;
            _logger = logger;
        }

        [HttpPost("Basic")]
        public async Task<IActionResult> SubmitBasicTest([FromBody] BasicTestResultDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            try
            {
                await _testService.SubmitBasicTestAsync(userId, dto);
                return Ok(new { Message = "Temel test sonuçları başarıyla kaydedildi." });
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
                _logger.LogError(ex, "SubmitBasicTest sırasında beklenmedik hata. UserId: {UserId}", userId);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }

        [HttpPost("Detailed")]
        public async Task<IActionResult> SubmitDetailedTest([FromBody] DetailedTestResultDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            try
            {
                await _testService.SubmitDetailedTestAsync(userId, dto);
                return Ok(new { Message = "Detaylı test sonuçları başarıyla kaydedildi." });
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
                _logger.LogError(ex, "SubmitDetailedTest sırasında beklenmedik hata. UserId: {UserId}", userId);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }
    }
}
