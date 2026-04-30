using EvArkadasimV2.Application.DTOs.Property;
using EvArkadasimV2.Application.Exceptions;
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
        private readonly ILogger<PropertyController> _logger;

        public PropertyController(IPropertyService propertyService, ILogger<PropertyController> logger)
        {
            _propertyService = propertyService;
            _logger = logger;
        }

        /// <summary>Emlak ilanlarını filtreler ve sayfalı listeler.</summary>
        /// <param name="location">Konum filtresi (şehir, ilçe vb.). Opsiyonel.</param>
        /// <param name="propertyType">İlan türü filtresi (Apartment, House, Studio…). Opsiyonel.</param>
        /// <param name="maxPrice">Maksimum kira filtresi. Opsiyonel.</param>
        /// <param name="bedrooms">Yatak odası sayısı filtresi. Opsiyonel.</param>
        /// <param name="petsAllowed">Evcil hayvan izni filtresi. Opsiyonel.</param>
        /// <param name="skip">Atlanan kayıt sayısı (offset). Varsayılan: 0.</param>
        /// <param name="take">Döndürülecek kayıt sayısı. Varsayılan: 20.</param>
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

        /// <summary>Tek bir emlak ilanının detayını döner.</summary>
        /// <param name="id">İlan ID'si.</param>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(PropertyDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
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

        /// <summary>Yeni emlak ilanı oluşturur.</summary>
        /// <remarks>İlan sahibi JWT token'dan belirlenir; body'den alınmaz.</remarks>
        [HttpPost]
        [ProducesResponseType(typeof(PropertyDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
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

            try
            {
                var result = await _propertyService.UpdateAsync(id, currentUserId, dto);
                return Ok(result);
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
                _logger.LogError(ex, "Update sırasında beklenmedik hata. Id: {Id}", id);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
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

            try
            {
                await _propertyService.DeleteAsync(id, currentUserId);
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
                _logger.LogError(ex, "Delete sırasında beklenmedik hata. Id: {Id}", id);
                return StatusCode(500, new { Message = "Sunucu hatası oluştu." });
            }
        }
    }
}
