using System.Text.Json;
using System.Text.Json.Serialization;
using EvArkadasimV2.Application.Interfaces.Services;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace EvArkadasimV2.Infrastructure.Services
{
    public class RedisCacheService : ICacheService
    {
        private readonly IDistributedCache _cache;
        private readonly ILogger<RedisCacheService> _logger;
        private static readonly JsonSerializerOptions _opts = new()
        {
            Converters = { new JsonStringEnumConverter() }
        };

        public RedisCacheService(IDistributedCache cache, ILogger<RedisCacheService> logger)
        {
            _cache = cache;
            _logger = logger;
        }

        public async Task<T?> GetAsync<T>(string key)
        {
            try
            {
                var data = await _cache.GetStringAsync(key);
                return data is null ? default : JsonSerializer.Deserialize<T>(data, _opts);
            }
            catch (RedisConnectionException ex)
            {
                // Redis yoksa cache miss gibi davran — uygulama DB'den okur
                _logger.LogWarning("Redis bağlantısı yok, cache atlanıyor: {Message}", ex.Message);
                return default;
            }
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan expiry)
        {
            try
            {
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = expiry
                };
                await _cache.SetStringAsync(key, JsonSerializer.Serialize(value, _opts), options);
            }
            catch (RedisConnectionException ex)
            {
                _logger.LogWarning("Redis bağlantısı yok, set atlanıyor: {Message}", ex.Message);
            }
        }

        public async Task RemoveAsync(string key)
        {
            try
            {
                await _cache.RemoveAsync(key);
            }
            catch (RedisConnectionException ex)
            {
                _logger.LogWarning("Redis bağlantısı yok, remove atlanıyor: {Message}", ex.Message);
            }
        }
    }
}
