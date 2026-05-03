using EvArkadasimV2.Application.DTOs.Auth;

namespace EvArkadasimV2.Application.Interfaces.Services
{
    // Bu arayüz, kullanıcı doğrulama işlemleri için gerekli metotları tanımlar.
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto request);
        Task<AuthResponseDto> LoginAsync(LoginDto request);
        Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);
        Task LogoutAsync(string jti, string userId, DateTime tokenExpiresAt, string? refreshToken);
    }
}
