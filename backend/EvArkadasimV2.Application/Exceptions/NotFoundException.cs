namespace EvArkadasimV2.Application.Exceptions
{
    // Varlığı beklenen kaynak bulunamadı → 404 Not Found.
    public class NotFoundException : AppException
    {
        public NotFoundException(string message) : base(message, 404) { }
    }
}
