namespace EvArkadasimV2.Application.Exceptions
{
    // Kaynak var ama bu kullanıcının erişim hakkı yok → 403 Forbidden.
    // 401'den farkı: 401 "kim olduğunu bilmiyorum" (token yok/geçersiz),
    // 403 "kim olduğunu biliyorum ama izin vermiyorum" (başkasının sohbetine girmeye çalışıyor).
    public class ForbiddenException : AppException
    {
        public ForbiddenException(string message = "Bu kaynağa erişim yetkiniz yok.")
            : base(message, 403) { }
    }
}
