using System.ComponentModel.DataAnnotations;

namespace EvArkadasimV2.Application.DTOs.Auth
{
    public class LoginDto
    {
        [Required]
        [EmailAddress]
        [MaxLength(256)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Password { get; set; } = string.Empty;
    }
}
