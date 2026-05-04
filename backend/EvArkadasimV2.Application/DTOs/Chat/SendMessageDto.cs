using System.ComponentModel.DataAnnotations;

namespace EvArkadasimV2.Application.DTOs.Chat
{
    public class SendMessageDto
    {
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Geçerli bir eşleşme ID'si giriniz.")]
        public int MatchId { get; set; }

        [Required(ErrorMessage = "Mesaj içeriği boş olamaz.")]
        [StringLength(2000, MinimumLength = 1, ErrorMessage = "Mesaj 1-2000 karakter arasında olmalıdır.")]
        public string Content { get; set; } = null!;

        [Required(ErrorMessage = "Mesaj türü belirtilmelidir.")]
        [RegularExpression("(?i)^(text|image|gif)$", ErrorMessage = "Geçersiz mesaj türü. Geçerli değerler: text, image, gif")]
        public string Type { get; set; } = "text";
    }
}
