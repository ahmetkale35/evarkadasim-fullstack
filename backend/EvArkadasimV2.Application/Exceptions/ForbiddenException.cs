namespace EvArkadasimV2.Application.Exceptions
{
    // Kimlik doğrulandı ama kaynağa erişim yetkisi yok → 403 Forbidden.
    public class ForbiddenException : AppException
    {
        public ForbiddenException(string message = "Bu kaynağa erişim yetkiniz yok.")
            : base(message, 403) { }
    }
}
