using System.ComponentModel.DataAnnotations;

namespace EvArkadasimV2.Application.DTOs.User
{
    public class SwipeRequestDto
    {
        [Required]
        public string ReceiverId { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(Like|Pass|SuperLike)$", ErrorMessage = "SwipeType 'Like', 'Pass' veya 'SuperLike' olmalıdır.")]
        public string SwipeType { get; set; } = string.Empty;
    }
}
