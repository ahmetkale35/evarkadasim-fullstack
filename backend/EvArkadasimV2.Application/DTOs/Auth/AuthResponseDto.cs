using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvArkadasimV2.Application.DTOs.Auth
{
    // Bu sınıf, kullanıcı doğrulama işlemi sonucunda döndürülecek bilgileri temsil eder.
    public class AuthResponseDto
    {
        public string Token { get; set; }
        public string Expiration { get; set; }
        public string UserId { get; set; }
        public string Name { get; set; }
    }
}
