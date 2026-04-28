using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvArkadasimV2.Application.DTOs.Auth
{
    // Bu sınıf, kullanıcı giriş işlemi için gerekli bilgileri temsil eder.
    public class LoginDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}
