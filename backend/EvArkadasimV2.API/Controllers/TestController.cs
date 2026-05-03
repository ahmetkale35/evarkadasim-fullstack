using EvArkadasimV2.Application.DTOs.Test;
using EvArkadasimV2.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvArkadasimV2.API.Controllers
{
    /// <summary>Temel ve detaylı kişilik testi sonuçlarını kaydeder.</summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [Produces("application/json")]
    public class TestController : ControllerBase
    {
        private readonly ITestService _testService;

        public TestController(ITestService testService)
        {
            _testService = testService;
        }

        /// <summary>Temel test sonuçlarını kaydeder.</summary>
        /// <param name="dto">Test cevapları.</param>
        [HttpPost("Basic")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> SubmitBasicTest([FromBody] BasicTestResultDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            await _testService.SubmitBasicTestAsync(userId, dto);
            return Ok(new { Message = "Temel test sonuçları başarıyla kaydedildi." });
        }

        /// <summary>Detaylı test sonuçlarını kaydeder.</summary>
        /// <param name="dto">Test cevapları.</param>
        [HttpPost("Detailed")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> SubmitDetailedTest([FromBody] DetailedTestResultDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            await _testService.SubmitDetailedTestAsync(userId, dto);
            return Ok(new { Message = "Detaylı test sonuçları başarıyla kaydedildi." });
        }
    }
}
