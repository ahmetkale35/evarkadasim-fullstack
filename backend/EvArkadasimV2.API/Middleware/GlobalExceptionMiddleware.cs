using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.API.Models;
using System.Text.Json;

namespace EvArkadasimV2.API.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (AppException ex)
            {
                // Beklenen uygulama hatası: iş kuralı ihlali, kaynak yok, yetkisiz erişim.
                // Stack trace'i loglamamıza gerek yok — bu hata "normal" bir iş akışı sonucu.
                _logger.LogWarning("Uygulama hatası: {StatusCode} - {Message}", ex.StatusCode, ex.Message);
                await WriteErrorAsync(context, ex.StatusCode, ex.Message);
            }
            catch (Exception ex)
            {
                // Beklenmedik sistem hatası: NullReference, DbException, vs.
                // Stack trace'i logla (production debug için kritik), ama client'a verme.
                _logger.LogError(ex, "Beklenmedik hata: {Path}", context.Request.Path);
                await WriteErrorAsync(context, 500, "Sunucu hatası oluştu.");
            }
        }

        private static async Task WriteErrorAsync(HttpContext context, int statusCode, string message)
        {
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";

            var response = new ErrorResponse { StatusCode = statusCode, Message = message };
            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }
    }
}
