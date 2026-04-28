using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvArkadasimV2.Application.DTOs.Property
{
    public class CreatePropertyDto
    {
        public string Title { get; set; }
        public decimal PriceAmount { get; set; }
        public string Currency { get; set; }
        public string PricePeriod { get; set; }
        public string Location { get; set; }
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
        public List<string> Images { get; set; }
        public string Description { get; set; }
        public List<string> Amenities { get; set; }
        public DateTime AvailableFrom { get; set; }
        public string PropertyType { get; set; }
        public bool Furnished { get; set; }
        public bool PetsAllowed { get; set; }
        public bool SmokingAllowed { get; set; }
    }
}
