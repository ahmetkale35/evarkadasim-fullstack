using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EvArkadasimV2.Application.Interfaces.Services;

namespace EvArkadasimV2.API.Middleware
{
    /// <summary>
    /// Her authenticated request'te access token'ın revoke edilip edilmediğini kontrol eder.
    /// Logout sonrası token süresi dolana kadar geçerli görünen token'ların kullanımını engeller.
    /// </summary>
    public class TokenRevocationMiddleware
    {
        private readonly RequestDelegate _next;

        public TokenRevocationMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, ITokenService tokenService)
        {
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var jti = context.User.FindFirstValue(JwtRegisteredClaimNames.Jti);
                if (jti != null && await tokenService.IsAccessTokenRevokedAsync(jti))
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return;
                }
            }
            await _next(context);
        }
    }
}
