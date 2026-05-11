using EvArkadasimV2.Application.DTOs.User;

namespace EvArkadasimV2.Application.DTOs.Chat
{
    public class MatchDto
    {
        public string MatchId { get; set; } = null!;
        public UserSummaryDto MatchedUser { get; set; } = null!;
        public DateTime MatchedAt { get; set; }
        public MessageDto? LastMessage { get; set; }
        public bool IsNewMatch { get; set; }
        public double CompatibilityScore { get; set; }
    }
}
