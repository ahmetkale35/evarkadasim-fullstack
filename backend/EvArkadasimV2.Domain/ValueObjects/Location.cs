using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace EvArkadasimV2.Domain.ValueObjects
{
    // Bu sınıf, bir kişinin konumunu temsil eder
    [Owned]
    public class Location
    {
        public string? City { get; set; } 
        public int? Distance { get; set; } 
    }
}
