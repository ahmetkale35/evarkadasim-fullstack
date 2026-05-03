namespace EvArkadasimV2.Application.DTOs.Auth
{
    // Bu sınıf, kullanıcı doğrulama işlemi sonucunda döndürülecek bilgileri temsil eder.
    public class AuthResponseDto
    {
        public string Token { get; set; } = null!;
        public string Expiration { get; set; } = null!;
        public string UserId { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string RefreshToken { get; set; } = null!;
    }
}
