namespace EvArkadasimV2.Application.Exceptions
{
    // Kayıt varlığı garantilenmiş ama bulunamadığında fırlatılır → Controller'da 404 döner.
    // Örnek: Geçerli bir token'la gelen istek ama veritabanında kullanıcı silinmiş.
    public class NotFoundException : AppException
    {
        public NotFoundException(string message) : base(message, 404) { }
    }
}
