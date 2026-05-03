namespace EvArkadasimV2.Application.Exceptions
{
    // Kimlik doğrulama başarısız → 401 Unauthorized. (Yanlış şifre, süresi dolmuş token vb.)
    public class UnauthorizedException : AppException
    {
        public UnauthorizedException(string message) : base(message, 401) { }
    }
}
