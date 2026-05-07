using EvArkadasimV2.Domain.Enums;

namespace EvArkadasimV2.Application.DTOs.Property
{
    public class PropertyMapPinDto
    {
        public int Id { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Price { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public PropertyType PropertyType { get; set; }
        public string OwnerId { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
    }
}
