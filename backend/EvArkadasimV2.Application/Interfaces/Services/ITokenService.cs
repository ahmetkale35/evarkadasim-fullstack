using EvArkadasimV2.Domain.Entities;

namespace EvArkadasimV2.Application.Interfaces.Services
{
    public interface ITokenService
    {
        // Tuple dönüş tipi, AuthService'in JWT ayarlarına (ExpiryInMinutes) doğrudan
        // erişmesini engeller. Süre hesabı tek bir yerde (TokenService) yaşar.
        (string Token, DateTime Expiration) GenerateToken(AppUser user);
    }
}
