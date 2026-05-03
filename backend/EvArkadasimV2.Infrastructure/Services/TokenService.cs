using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Application.Options;
using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace EvArkadasimV2.Infrastructure.Services
{
    public class TokenService : ITokenService
    {
        private readonly JwtSettings _jwtSettings;
        private readonly AppDbContext _db;

        public TokenService(IOptions<JwtSettings> jwtOptions, AppDbContext db)
        {
            _jwtSettings = jwtOptions.Value;
            _db = db;
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
                // Jti (JWT ID): Her token'a benzersiz bir kimlik atar. Token iptali
                // için RevokedTokens tablosunda bu değer üzerinden eşleştirme yapılır.
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

        public async Task<string> GenerateRefreshTokenAsync(string userId)
        {
            var token = Guid.NewGuid().ToString("N");

            var refreshToken = new RefreshToken
            {
                Token = token,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                IsRevoked = false
            };

            _db.RefreshTokens.Add(refreshToken);
            await _db.SaveChangesAsync();

            return token;
        }

        public async Task<(bool IsValid, string UserId)> ValidateRefreshTokenAsync(string token)
        {
            var refreshToken = await _db.RefreshTokens
                .FirstOrDefaultAsync(t => t.Token == token);

            if (refreshToken == null || refreshToken.IsRevoked || refreshToken.ExpiresAt <= DateTime.UtcNow)
                return (false, string.Empty);

            return (true, refreshToken.UserId);
        }

        public async Task RevokeRefreshTokenAsync(string token)
        {
            var refreshToken = await _db.RefreshTokens
                .FirstOrDefaultAsync(t => t.Token == token);

            if (refreshToken != null)
            {
                refreshToken.IsRevoked = true;
                await _db.SaveChangesAsync();
            }
        }

        public async Task RevokeAccessTokenAsync(string jti, string userId, DateTime tokenExpiresAt)
        {
            var revokedToken = new RevokedToken
            {
                Jti = jti,
                UserId = userId,
                RevokedAt = DateTime.UtcNow,
                TokenExpiresAt = tokenExpiresAt
            };

            _db.RevokedTokens.Add(revokedToken);
            await _db.SaveChangesAsync();
        }

        public async Task<bool> IsAccessTokenRevokedAsync(string jti)
        {
            return await _db.RevokedTokens.AnyAsync(t => t.Jti == jti);
        }
    }
}
