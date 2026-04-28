using EvArkadasimV2.Application.DTOs.Test;
using EvArkadasimV2.Domain.Enums;

namespace EvArkadasimV2.Application.DTOs.User
{
    public class UserProfileDto
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
        // Enum tipi: JsonStringEnumConverter sayesinde JSON'da string olarak serialize edilir
        // (örn. "Private"). Null → "tercih belirtmemiş" anlamında, frontend'in "any" kavramına
        // karşılık gelir.
        public RoomType? RoomType { get; set; }
        public LookingFor? LookingFor { get; set; }
        public bool IsVerified { get; set; }
        public DateTime LastActive { get; set; }
        public int Cleanliness { get; set; }
        public int SocialLevel { get; set; }
        public BasicTestResultDto? CharacterProfile { get; set; }
        public int LikedProfilesCount { get; set; }
        public int MatchesCount { get; set; }
        public double CompatibilityScore { get; set; }
    }

    public class LocationDto
    {
        public string? City { get; set; }
        public int Distance { get; set; }
    }
}
