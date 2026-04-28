using EvArkadasimV2.Domain.Enums;

namespace EvArkadasimV2.Application.DTOs.Property
{
    public class UpdatePropertyDto
    {
        public string Title { get; set; } = string.Empty;
        public decimal PriceAmount { get; set; }
        public string Currency { get; set; } = "$";
        public string PricePeriod { get; set; } = "month";
        public string Location { get; set; } = string.Empty;
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
        public List<string> Images { get; set; } = new();
        public string? Description { get; set; }
        public List<string> Amenities { get; set; } = new();
        public DateTime AvailableFrom { get; set; }
        public PropertyType PropertyType { get; set; }
        public bool Furnished { get; set; }
        public bool PetsAllowed { get; set; }
        public bool SmokingAllowed { get; set; }
    }
}
