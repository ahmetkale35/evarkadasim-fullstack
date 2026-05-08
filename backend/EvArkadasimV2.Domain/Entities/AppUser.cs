using Microsoft.AspNetCore.Identity;

namespace EvArkadasimV2.Domain.Entities
{
    public class AppUser : IdentityUser
    {
        public string? Name { get; set; }
        public string? LastName { get; set; }

        // Her zaman cascade insert ile oluşturulur; Include() olmadan yüklenen sorgularda null olabilir.
        public UserProfile Profile { get; set; } = null!;
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
        public ICollection<Property> Properties { get; set; } = new List<Property>();
    }
}
