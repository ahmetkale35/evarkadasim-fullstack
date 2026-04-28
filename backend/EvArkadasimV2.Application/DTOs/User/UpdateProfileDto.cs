using System.ComponentModel.DataAnnotations;

namespace EvArkadasimV2.Application.DTOs.User
{
    // Tüm alanlar nullable: Client'ın göndermediği alan null gelir ve ProfileService
    // bu alanları veritabanındaki mevcut değerin üzerine yazmaz.
    // Bu yaklaşım HTTP PUT ile kısmi güncelleme (partial update) semantiği sağlar.
    public class UpdateProfileDto
    {
        [MaxLength(500)]
        public string? Bio { get; set; }

        [MaxLength(100)]
        public string? Budget { get; set; }

        [MaxLength(20)]
        public string? MoveInDate { get; set; }

        public List<string>? Lifestyle { get; set; }
        public List<string>? Interests { get; set; }
        public List<string>? Photos { get; set; }

        [Range(1, 5)]
        public int? Cleanliness { get; set; }

        [Range(1, 5)]
        public int? SocialLevel { get; set; }

        public bool? IsOnlineStatusVisible { get; set; }
        public bool? NotificationsEnabled { get; set; }
    }
}
