using EvArkadasimV2.Application.DTOs.Property;
using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvArkadasimV2.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PropertyController : ControllerBase
    {
        private readonly IPropertyService _propertyService;
        private readonly ILogger<PropertyController> _logger;

        public PropertyController(IPropertyService propertyService, ILogger<PropertyController> logger)
        {
            _propertyService = propertyService;
            _logger = logger;
        }

        // GET: api/property?location=istanbul&propertyType=Apartment&maxPrice=5000&bedrooms=2&petsAllowed=true&skip=0&take=20
        [HttpGet]
        public async Task<IActionResult> GetList(
            [FromQuery] string? location,
            [FromQuery] PropertyType? propertyType,
            [FromQuery] decimal? maxPrice,
            [FromQuery] int? bedrooms,
            [FromQuery] bool? petsAllowed,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 20)
        {
            try
            {
                var result = await _propertyService.GetListAsync(
                    location, propertyType, maxPrice, bedrooms, petsAllowed, skip, take);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetList sırasında beklenmedik hata.");
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }

        // GET: api/property/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var result = await _propertyService.GetByIdAsync(id);
                return Ok(result);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetById sırasında beklenmedik hata. Id: {Id}", id);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }

        // POST: api/property
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePropertyDto dto)
        {
            var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            try
            {
                var result = await _propertyService.CreateAsync(ownerId, dto);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Create sırasında beklenmedik hata. OwnerId: {OwnerId}", ownerId);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }

        // PUT: api/property/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePropertyDto dto)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            try
            {
                var result = await _propertyService.UpdateAsync(id, currentUserId, dto);
                return Ok(result);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (DomainException ex)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Update sırasında beklenmedik hata. Id: {Id}", id);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }

        // DELETE: api/property/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            try
            {
                await _propertyService.DeleteAsync(id, currentUserId);
                return NoContent();
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (DomainException ex)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Delete sırasında beklenmedik hata. Id: {Id}", id);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }
    }
}
