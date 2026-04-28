using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Application.Options;
using EvArkadasimV2.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace EvArkadasimV2.Infrastructure.Services
{
    public class TokenService : ITokenService
    {
        private readonly JwtSettings _jwtSettings;

        public TokenService(IOptions<JwtSettings> jwtOptions)
        {
            _jwtSettings = jwtOptions.Value;
        }

        public (string Token, DateTime Expiration) GenerateToken(AppUser user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
            var expiration = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryInMinutes);

            var claims = new List<Claim>
            {
                // ClaimTypes.NameIdentifier: Controller'larda User.FindFirstValue(ClaimTypes.NameIdentifier)
                // çalışabilmek için ASP.NET Identity sisteminin beklediği standart claim tipi.
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email!),
                new Claim(JwtRegisteredClaimNames.Name, user.Name ?? string.Empty),
                // Jti (JWT ID): Her token'a benzersiz bir kimlik atar. Gelecekte token
                // iptali (blacklist/revocation) uygulamak istersen bu claim üzerinden
                // Redis veya veritabanında eşleştirme yapabilirsin.
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = expiration,
                Issuer = _jwtSettings.Issuer,
                Audience = _jwtSettings.Audience,
                SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            return (tokenHandler.WriteToken(tokenHandler.CreateToken(tokenDescriptor)), expiration);
        }
    }
}
