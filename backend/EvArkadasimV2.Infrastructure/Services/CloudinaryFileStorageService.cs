using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Application.Options;
using Microsoft.Extensions.Options;

namespace EvArkadasimV2.Infrastructure.Services
{
    public class CloudinaryFileStorageService : IFileStorageService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryFileStorageService(IOptions<CloudinarySettings> options)
        {
            var s = options.Value;
            var account = new Account(s.CloudName, s.ApiKey, s.ApiSecret);
            _cloudinary = new Cloudinary(account) { Api = { Secure = true } };
        }

        public async Task<string> UploadAsync(Stream fileStream, string fileName, string folder)
        {
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(fileName, fileStream),
                Folder = folder
            };

            var result = await _cloudinary.UploadAsync(uploadParams);

            if (result.Error != null)
                throw new InvalidOperationException($"Cloudinary upload hatası: {result.Error.Message}");

            return result.SecureUrl.ToString();
        }

        public async Task DeleteAsync(string url)
        {
            var publicId = ExtractPublicId(url);
            if (string.IsNullOrEmpty(publicId)) return;

            await _cloudinary.DestroyAsync(new DeletionParams(publicId));
        }

        private static string ExtractPublicId(string url)
        {
            // https://res.cloudinary.com/{cloud}/image/upload/v{version}/{folder}/{file}.{ext}
            var uploadIndex = url.IndexOf("/upload/", StringComparison.Ordinal);
            if (uploadIndex < 0) return string.Empty;

            var after = url[(uploadIndex + 8)..];

            // strip version: v1234567890/
            if (after.StartsWith('v') && after.Contains('/'))
            {
                var slash = after.IndexOf('/');
                if (after[1..slash].All(char.IsDigit))
                    after = after[(slash + 1)..];
            }

            // strip extension
            var dot = after.LastIndexOf('.');
            return dot > 0 ? after[..dot] : after;
        }
    }
}
