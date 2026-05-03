using EvArkadasimV2.Application.DTOs.Auth;
using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace EvArkadasimV2.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly ITokenService _tokenService;

        public AuthService(UserManager<AppUser> userManager, ITokenService tokenService)
        {
            _userManager = userManager;
            _tokenService = tokenService;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto request)
        {
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
                throw new DomainException("Bu e-posta adresi zaten kullanımda.");

            var user = new AppUser
            {
                UserName = request.Email,
                Email = request.Email,
                Name = request.Name,
                // EF Core "cascade insert" davranışı: AppUser kaydedildiğinde
                // ilişkili UserProfile da otomatik olarak INSERT edilir.
                Profile = new UserProfile()
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(" | ", result.Errors.Select(e => e.Description));
                throw new DomainException($"Kayıt başarısız: {errors}");
            }

            var (token, expiration) = _tokenService.GenerateToken(user);
            var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user.Id);
            return BuildAuthResponse(user, token, expiration, refreshToken);
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);

            // Kullanıcı numaralandırması (user enumeration) saldırısını önlemek için
            // "kullanıcı yok" ile "şifre yanlış" durumlarında aynı hata mesajı dönülür.
            // Böylece saldırgan hangi e-postaların kayıtlı olduğunu tespit edemez.
            var isPasswordValid = user != null && await _userManager.CheckPasswordAsync(user, request.Password);
            if (!isPasswordValid)
                throw new UnauthorizedException("E-posta veya şifre hatalı.");

            var (token, expiration) = _tokenService.GenerateToken(user!);
            var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user!.Id);
            return BuildAuthResponse(user!, token, expiration, refreshToken);
        }

        public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
        {
            var (isValid, userId) = await _tokenService.ValidateRefreshTokenAsync(refreshToken);
            if (!isValid)
                throw new UnauthorizedException("Refresh token geçersiz veya süresi dolmuş.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new UnauthorizedException("Kullanıcı bulunamadı.");

            // Eski refresh token'ı revoke et, yeni token çifti üret
            await _tokenService.RevokeRefreshTokenAsync(refreshToken);

            var (newToken, expiration) = _tokenService.GenerateToken(user);
            var newRefreshToken = await _tokenService.GenerateRefreshTokenAsync(user.Id);
            return BuildAuthResponse(user, newToken, expiration, newRefreshToken);
        }

        public async Task LogoutAsync(string jti, string userId, DateTime tokenExpiresAt, string? refreshToken)
        {
            await _tokenService.RevokeAccessTokenAsync(jti, userId, tokenExpiresAt);

            if (!string.IsNullOrWhiteSpace(refreshToken))
                await _tokenService.RevokeRefreshTokenAsync(refreshToken);
        }

        private static AuthResponseDto BuildAuthResponse(AppUser user, string token, DateTime expiration, string refreshToken) =>
            new()
            {
                Token = token,
                // ISO 8601 formatı ("o"): "2026-04-25T14:30:00.0000000Z"
                // Timezone belirsizliği olmadan client-server arasında güvenli tarih aktarımı sağlar.
                Expiration = expiration.ToString("o"),
                UserId = user.Id,
                Name = user.Name ?? string.Empty,
                RefreshToken = refreshToken
            };
    }
}
