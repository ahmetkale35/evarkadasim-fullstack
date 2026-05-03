namespace EvArkadasimV2.Application.Exceptions
{
    // Öngörülen uygulama hatalarının tabanı. GlobalExceptionMiddleware bu hiyerarşiyi
    // System.Exception'dan ayırt ederek uygun HTTP kodu döner ve stack trace loglamaz.
    public abstract class AppException : Exception
    {
        public int StatusCode { get; }

        protected AppException(string message, int statusCode) : base(message)
        {
            StatusCode = statusCode;
        }
    }
}
