namespace EvArkadasimV2.Application.DTOs.Chat
{
    public class PagedMessagesDto
    {
        public List<MessageDto> Messages { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        // Sonraki sayfa var mı? Frontend "load more" butonu için kullanır.
        public bool HasMore { get; set; }
    }
}
