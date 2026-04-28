using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvArkadasimV2.Application.DTOs.Property
{
    public class PropertyDto
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string Price { get; set; } // Örn: "$2,800/month"
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
