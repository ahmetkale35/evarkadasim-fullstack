namespace EvArkadasimV2.Application.Interfaces.Services
{
    public interface IFileStorageService
    {
        Task<string> UploadAsync(Stream fileStream, string fileName, string folder);
        Task DeleteAsync(string url);
    }
}
