namespace EvArkadasimV2.Application.Exceptions
{
    // İş kuralı ihlali → 400 Bad Request.
    public class DomainException : AppException
    {
        public DomainException(string message) : base(message, 400) { }
    }
}
