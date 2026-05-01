namespace EvArkadasimV2.Application.Exceptions
{
    // İş kuralı ihlallerini temsil eder: "Bu e-posta kullanımda", "Profil bulunamadı" gibi.
    // Bunlar kullanıcının düzeltebileceği hatalardır → Controller'da 400 Bad Request döner.
    //
    // Generic Exception fırlatmak yerine özel exception hiyerarşisi kullanmanın nedeni:
    // Controller'da catch bloklarını ayırt edebilmek. Beklenen iş hataları ile
    // beklenmedik sistem hataları (NullReferenceException, DbException) farklı
    // HTTP kodlarıyla ve farklı log seviyeleriyle işlenmelidir.
    public class DomainException : AppException
    {
        public DomainException(string message) : base(message, 400) { }
    }
}
