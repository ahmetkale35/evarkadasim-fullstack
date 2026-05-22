using System.Security.Claims;
using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EvArkadasimV2.API.Controllers
{
    /// <summary>Fotoğraf ve dosya yükleme endpoint'leri.</summary>
    [ApiController]
    [Route("api/upload")]
    [Authorize]
    public class UploadController : ControllerBase
    {
        private static readonly HashSet<string> AllowedMimeTypes =
            ["image/jpeg", "image/png", "image/webp"];
        private const long MaxFileSize = 5 * 1024 * 1024; // 5 MB
        private const int MaxPhotos = 6;

        private readonly IFileStorageService _storage;
        private readonly IUserRepository _userRepo;

        public UploadController(IFileStorageService storage, IUserRepository userRepo)
        {
            _storage = storage;
            _userRepo = userRepo;
        }

        /// <summary>Profil fotoğrafı yükler. Döner: { url }</summary>
        [HttpPost("photo")]
        public async Task<IActionResult> UploadPhoto(IFormFile file)
        {
            var error = Validate(file);
            if (error != null) return BadRequest(new { message = error });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var user = await _userRepo.GetUserWithProfileAsync(userId, tracking: false);
            if (user?.Profile?.Photos?.Count >= MaxPhotos)
                return BadRequest(new { message = $"En fazla {MaxPhotos} fotoğraf yükleyebilirsiniz." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"{userId}_{Guid.NewGuid()}{ext}";

            await using var stream = file.OpenReadStream();
            var url = await _storage.UploadAsync(stream, fileName, "photos");
            return Ok(new { url });
        }

        /// <summary>İlan fotoğrafı yükler. Döner: { url }</summary>
        [HttpPost("property")]
        public async Task<IActionResult> UploadPropertyImage(IFormFile file)
        {
            var error = Validate(file);
            if (error != null) return BadRequest(new { message = error });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"{userId}_{Guid.NewGuid()}{ext}";

            await using var stream = file.OpenReadStream();
            var url = await _storage.UploadAsync(stream, fileName, "properties");
            return Ok(new { url });
        }

        /// <summary>Verilen URL'deki dosyayı Cloudinary'den siler. Sadece kendi dosyan silinebilir.</summary>
        [HttpDelete]
        public async Task<IActionResult> Delete([FromQuery] string url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return BadRequest(new { message = "url parametresi zorunlu." });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            if (!url.Contains($"/{userId}_", StringComparison.Ordinal))
                return Forbid();

            await _storage.DeleteAsync(url);
            return NoContent();
        }

        private static string? Validate(IFormFile? file)
        {
            if (file == null || file.Length == 0) return "Dosya boş.";
            if (file.Length > MaxFileSize) return "Dosya 5 MB'ı aşamaz.";
            if (!AllowedMimeTypes.Contains(file.ContentType.ToLowerInvariant()))
                return "Sadece JPEG, PNG veya WebP kabul edilir.";
            return null;
        }
    }
}
