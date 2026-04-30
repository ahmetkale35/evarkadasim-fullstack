namespace EvArkadasimV2.Application.DTOs.User
{
    public class PagedFeedDto
    {
        public List<UserSummaryDto> Users { get; set; } = new();
        public int Skip { get; set; }
        public int Take { get; set; }
        public int TotalCount { get; set; }
        // Sonraki sayfa var mı? Frontend "load more" / sonsuz kaydırma için kullanır.
        public bool HasMore { get; set; }
    }
}
