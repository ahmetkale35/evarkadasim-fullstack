using EvArkadasimV2.Application.DTOs.Property;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvArkadasimV2.API.Controllers
{
    /// <summary>Emlak ilanı yönetimi.</summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [Produces("application/json")]
    public class PropertyController : ControllerBase
    {
        private readonly IPropertyService _propertyService;

        public PropertyController(IPropertyService propertyService)
        {
            _propertyService = propertyService;
        }

        /// <summary>Emlak ilanlarını filtreler ve sayfalı listeler.</summary>
        [HttpGet]
        [ProducesResponseType(typeof(List<PropertyDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetList(
            [FromQuery] string? location,
            [FromQuery] PropertyType? propertyType,
            [FromQuery] decimal? maxPrice,
            [FromQuery] int? bedrooms,
            [FromQuery] bool? petsAllowed,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 20)
        {
            var result = await _propertyService.GetListAsync(
                location, propertyType, maxPrice, bedrooms, petsAllowed, skip, take);
            return Ok(result);
        }

        /// <summary>Koordinatı olan ilanları harita pin'i olarak döner. city parametresi verilirse sadece o şehrin sahibi olan ilanlar gelir.</summary>
        [HttpGet("map")]
        [ProducesResponseType(typeof(List<PropertyMapPinDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMapPins([FromQuery] string? city = null)
        {
            var result = await _propertyService.GetMapPinsAsync(city);
            return Ok(result);
        }

        /// <summary>Tek bir emlak ilanının detayını döner.</summary>
        /// <param name="id">İlan ID'si.</param>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(PropertyDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _propertyService.GetByIdAsync(id);
            return Ok(result);
        }

        /// <summary>Yeni emlak ilanı oluşturur.</summary>
        /// <remarks>İlan sahibi JWT token'dan belirlenir; body'den alınmaz.</remarks>
        [HttpPost]
        [ProducesResponseType(typeof(PropertyDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Create([FromBody] CreatePropertyDto dto)
        {
            var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await _propertyService.CreateAsync(ownerId, dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        /// <summary>Mevcut ilanı günceller. Yalnızca ilan sahibi güncelleyebilir.</summary>
        /// <param name="id">İlan ID'si.</param>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(PropertyDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePropertyDto dto)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await _propertyService.UpdateAsync(id, currentUserId, dto);
            return Ok(result);
        }

        /// <summary>İlanı siler. Yalnızca ilan sahibi silebilir.</summary>
        /// <param name="id">İlan ID'si.</param>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Delete(int id)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            await _propertyService.DeleteAsync(id, currentUserId);
            return NoContent();
        }
    }
}
