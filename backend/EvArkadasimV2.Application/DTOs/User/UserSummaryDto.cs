using EvArkadasimV2.Domain.Enums;

namespace EvArkadasimV2.Application.DTOs.User
{
    // Feed (swipe kartı) için kullanıcı özet DTO'su.
    // Frontend types/index.ts → User interface ile birebir eşleşir.
    // CharacterProfile, FinalScores ve internal sayaçlar (LikedProfilesCount, MatchesCount)
    // feed'de yer almaz — ihtiyaç olunca tekil profil endpoint'i (GET /api/profile/{id})
    // çağrılır.
    public class UserSummaryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Age { get; set; }
        public string? Bio { get; set; }
        public string? Budget { get; set; }
        public string? MoveInDate { get; set; }
        public List<string> Lifestyle { get; set; } = new();
        public List<string> Photos { get; set; } = new();
        public LocationDto? Location { get; set; }
        public List<string> Interests { get; set; } = new();
        public string? Occupation { get; set; }
        public string? Education { get; set; }
        public RoomType? RoomType { get; set; }
        public LookingFor? LookingFor { get; set; }
        public bool IsVerified { get; set; }
        public DateTime LastActive { get; set; }
        public int Cleanliness { get; set; }
        public int SocialLevel { get; set; }
        public double? Compatibility { get; set; }
    }
}
