using System.ComponentModel.DataAnnotations;

namespace EvArkadasimV2.Application.DTOs.Auth
{
    public class RefreshTokenRequestDto
    {
        [Required]
        public string RefreshToken { get; set; } = null!;
    }
}
