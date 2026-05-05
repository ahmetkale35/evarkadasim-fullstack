using System.Text.Json;
using System.Text.Json.Serialization;
using EvArkadasimV2.Application.Interfaces.Services;
using Microsoft.Extensions.Caching.Distributed;

namespace EvArkadasimV2.Infrastructure.Services
{
    public class RedisCacheService : ICacheService
    {
        private readonly IDistributedCache _cache;
        private static readonly JsonSerializerOptions _opts = new()
        {
            Converters = { new JsonStringEnumConverter() }
        };

        public RedisCacheService(IDistributedCache cache) => _cache = cache;

        public async Task<T?> GetAsync<T>(string key)
        {
            var data = await _cache.GetStringAsync(key);
            return data is null ? default : JsonSerializer.Deserialize<T>(data, _opts);
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan expiry)
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiry
            };
            await _cache.SetStringAsync(key, JsonSerializer.Serialize(value, _opts), options);
        }

        public Task RemoveAsync(string key) => _cache.RemoveAsync(key);
    }
}
