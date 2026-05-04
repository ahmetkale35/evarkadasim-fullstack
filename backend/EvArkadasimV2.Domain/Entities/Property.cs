using EvArkadasimV2.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvArkadasimV2.Domain.Entities
{
    public class Property
    {
        public int Id { get; set; }
        public string Title { get; set; } = null!;

        // Fiyat için Backend'de matematiksel tutuyoruz, DTO'da string'e çevireceğiz
        public decimal PriceAmount { get; set; }
        public string Currency { get; set; } = "$";
        public string PricePeriod { get; set; } = "month";

        public string Location { get; set; } = null!;
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }

        public List<string> Images { get; set; } = new List<string>();
        public string Description { get; set; } = null!;
        public List<string> Amenities { get; set; } = new List<string>();

        public DateTime AvailableFrom { get; set; }
        public PropertyType PropertyType { get; set; }

        public bool Furnished { get; set; }
        public bool PetsAllowed { get; set; }
        public bool SmokingAllowed { get; set; }

        public string OwnerId { get; set; } = null!;
        public AppUser Owner { get; set; } = null!;
    }
}
