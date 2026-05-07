using EvArkadasimV2.Domain.Enums;

namespace EvArkadasimV2.Application.DTOs.Property
{
    public class PropertyDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Price { get; set; } = string.Empty; // "$2,800/month" formatında
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
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string OwnerId { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
    }
}
