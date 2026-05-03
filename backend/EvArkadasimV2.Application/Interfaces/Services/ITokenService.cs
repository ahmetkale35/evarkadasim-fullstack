using EvArkadasimV2.Domain.Entities;

namespace EvArkadasimV2.Application.Interfaces.Services
{
    public interface ITokenService
    {
        // Tuple dönüş tipi, AuthService'in JWT ayarlarına (ExpiryInMinutes) doğrudan
        // erişmesini engeller. Süre hesabı tek bir yerde (TokenService) yaşar.
        (string Token, DateTime Expiration) GenerateToken(AppUser user);

        // Refresh token işlemleri
        Task<string> GenerateRefreshTokenAsync(string userId);
        Task<(bool IsValid, string UserId)> ValidateRefreshTokenAsync(string token);
        Task RevokeRefreshTokenAsync(string token);

        // Access token revocation (logout / blacklist)
        Task RevokeAccessTokenAsync(string jti, string userId, DateTime tokenExpiresAt);
        Task<bool> IsAccessTokenRevokedAsync(string jti);
    }
}
