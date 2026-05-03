namespace EvArkadasimV2.Domain.Entities
{
    public class RevokedToken
    {
        public int Id { get; set; }
        public string Jti { get; set; } = null!;
        public string UserId { get; set; } = null!;
        public DateTime RevokedAt { get; set; }
        public DateTime TokenExpiresAt { get; set; }
    }
}
