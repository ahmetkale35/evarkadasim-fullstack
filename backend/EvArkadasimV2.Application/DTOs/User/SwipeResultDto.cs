namespace EvArkadasimV2.Application.DTOs.User
{
    // Swipe işleminin sonucunu client'a aktaran DTO.
    // IsMatch=true olduğunda mobil tarafın "It's a match!" ekranını açabilmesi için
    // eşleşilen kullanıcının Id'si de döndürülür; aksi halde MatchedUserId null kalır.
    public class SwipeResultDto
    {
        public bool IsMatch { get; set; }
        public string? MatchedUserId { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
