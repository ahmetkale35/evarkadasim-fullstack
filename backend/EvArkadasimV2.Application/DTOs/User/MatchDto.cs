namespace EvArkadasimV2.Application.DTOs.User
{
    public class MatchDto
    {
        public int MatchId { get; set; }
        public DateTime MatchedAt { get; set; }
        public bool IsNewMatch { get; set; }
        public UserSummaryDto MatchedUser { get; set; } = new();
        public string? LastMessage { get; set; }
    }
}
