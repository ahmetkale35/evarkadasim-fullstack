using Microsoft.AspNetCore.Identity;

namespace EvArkadasimV2.Domain.Entities
{
    public class AppUser : IdentityUser
    {
        public string? Name { get; set; }

        // null! (null-forgiving): EF Core navigation property'leri için yaygın bir kalıp.
        // Derleyiciye "bu alan çalışma anında null olmayacak" garantisi verilir; çünkü
        // AppUser her zaman bir Profile ile birlikte oluşturulur (AuthService bunu garantiler).
        // Include() yapılmadan çekilen sorguların sonuçlarına erişmeden önce null kontrolü yapılmalı.
        public UserProfile Profile { get; set; } = null!;
    }
}
