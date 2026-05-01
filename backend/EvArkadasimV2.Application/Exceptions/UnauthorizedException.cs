namespace EvArkadasimV2.Application.Exceptions
{
    // Kimlik doğrulama başarısız → 401 Unauthorized.
    // JWT middleware'in ürettiği 401'den farkı: o "token yok/geçersiz" (framework seviyesi),
    // bu "kimlik bilgileri yanlış" (uygulama iş mantığı seviyesi — login hatası gibi).
    public class UnauthorizedException : AppException
    {
        public UnauthorizedException(string message) : base(message, 401) { }
    }
}
