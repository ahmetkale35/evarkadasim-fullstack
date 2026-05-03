using EvArkadasimV2.Domain.Enums;
using EvArkadasimV2.Domain.ValueObjects;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvArkadasimV2.Domain.Entities
{
    public class UserProfile
    {
        public int Id { get; set; }
        public string AppUserId { get; set; }
        public AppUser AppUser { get; set; }

        public int Age { get; set; }
        public string? Bio { get; set; }
        public string? Budget { get; set; }
        public string? MoveInDate { get; set; }

        public List<string>? Lifestyle { get; set; } = new List<string>();
        public List<string>? Photos { get; set; } = new List<string>();
        public List<string>? Interests { get; set; } = new List<string>();

        public string? Occupation { get; set; }
        public string? Education { get; set; }
        public Location? Location { get; set; }
        // null = "fark etmez" filtresi; frontend "any" değerine karşılık gelir, enum'a eklenmedi.
        public RoomType? RoomType { get; set; }
        public LookingFor? LookingFor { get; set; }

        public bool IsVerified { get; set; }
        public DateTime LastActive { get; set; } = DateTime.UtcNow;
        public int Cleanliness { get; set; }
        public int SocialLevel { get; set; }

        // Test Sonuçları
        public BasicTestResults? InitialBasicTestResults { get; set; }
        public DetailedTestResults? DetailedTestResults { get; set; }
        public BasicTestResults? FinalScores { get; set; }

        // İstatistikler ve Ayarlar
        public int LikedProfilesCount { get; set; } = 0;
        public int MatchesCount { get; set; } = 0;
        public int ProfileViewsCount { get; set; } = 0;
        public bool IsOnlineStatusVisible { get; set; } = true;
        public bool NotificationsEnabled { get; set; } = true;
    }
}
