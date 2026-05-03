namespace EvArkadasimV2.Application.DTOs.Chat
{
    public class PagedMessagesDto
    {
        public List<MessageDto> Messages { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public bool HasMore { get; set; }
    }
}
