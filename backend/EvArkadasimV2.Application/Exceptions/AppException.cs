namespace EvArkadasimV2.Application.Exceptions
{
    // Uygulamaya özgü tüm beklenen hataların tabanı.
    // "Beklenen" = kullanıcı veya iş kuralından kaynaklanan, stack trace loglamaya gerek olmayan hata.
    // Middleware bu taban sınıfı görünce "bu öngörülmüş bir hata" diye bilir;
    // System.Exception görünce ise "beklenmedik, logla ve 500 dön" diye bilir.
    public abstract class AppException : Exception
    {
        public int StatusCode { get; }

        protected AppException(string message, int statusCode) : base(message)
        {
            StatusCode = statusCode;
        }
    }
}
