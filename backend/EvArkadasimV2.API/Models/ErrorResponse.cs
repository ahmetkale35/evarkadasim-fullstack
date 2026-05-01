namespace EvArkadasimV2.API.Models
{
    public class ErrorResponse
    {
        public int StatusCode { get; init; }
        public string Message { get; init; } = string.Empty;
    }
}
