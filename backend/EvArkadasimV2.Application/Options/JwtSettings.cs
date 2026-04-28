namespace EvArkadasimV2.Application.Options
{
    // Options Pattern: IConfiguration'ı doğrudan servislere inject etmek yerine,
    // yapılandırma değerlerini bir sınıfa bağlarız. Bu yaklaşım üç avantaj sağlar:
    // 1. Tip güvenliği — "JwtSettings:ExpiryInMinutes" gibi magic string'ler yok.
    // 2. Test edilebilirlik — servisleri test ederken IConfiguration mock'lamak yerine
    //    doğrudan bir JwtSettings nesnesi oluşturabilirsin.
    // 3. Katman bağımsızlığı — Application katmanı artık IConfiguration'a (Infrastructure
    //    detayı) değil, kendi tanımladığı bir sözleşmeye bağımlıdır.
    public class JwtSettings
    {
        public string Secret { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public int ExpiryInMinutes { get; set; }
    }
}
