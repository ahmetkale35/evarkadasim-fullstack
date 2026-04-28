namespace EvArkadasimV2.Application.DTOs.User
{
    // Tüm alanlar nullable: Client'ın göndermediği alan null gelir ve ProfileService
    // bu alanları veritabanındaki mevcut değerin üzerine yazmaz.
    // Bu yaklaşım HTTP PUT ile kısmi güncelleme (partial update) semantiği sağlar.
    public class UpdateProfileDto
    {
        public string? Bio { get; set; }
        public string? Budget { get; set; }
        public string? MoveInDate { get; set; }
        public List<string>? Lifestyle { get; set; }
        public List<string>? Interests { get; set; }
        public List<string>? Photos { get; set; }
        public int? Cleanliness { get; set; }
        public int? SocialLevel { get; set; }
        public bool? IsOnlineStatusVisible { get; set; }
        public bool? NotificationsEnabled { get; set; }
    }
}
