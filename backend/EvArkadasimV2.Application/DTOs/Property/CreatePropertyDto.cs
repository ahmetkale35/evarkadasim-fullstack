using System.ComponentModel.DataAnnotations;
using EvArkadasimV2.Domain.Enums;

namespace EvArkadasimV2.Application.DTOs.Property
{
    public class CreatePropertyDto : IValidatableObject
    {
        [Required]
        [StringLength(200, MinimumLength = 3)]
        public string Title { get; set; } = string.Empty;

        [Range(1, 1_000_000, ErrorMessage = "Fiyat 1 ile 1.000.000 arasında olmalı.")]
        public decimal PriceAmount { get; set; }

        [Required]
        [MaxLength(10)]
        public string Currency { get; set; } = "₺";

        [Required]
        [MaxLength(20)]
        public string PricePeriod { get; set; } = "ay";

        [Required]
        [StringLength(200, MinimumLength = 2)]
        public string Location { get; set; } = string.Empty;

        [Range(0, 20)]
        public int Bedrooms { get; set; }

        [Range(0, 20)]
        public int Bathrooms { get; set; }

        public List<string> Images { get; set; } = new();

        [MaxLength(2000)]
        public string? Description { get; set; }

        public List<string> Amenities { get; set; } = new();

        public DateTime AvailableFrom { get; set; }

        public PropertyType PropertyType { get; set; }
        public bool Furnished { get; set; }
        public bool PetsAllowed { get; set; }
        public bool SmokingAllowed { get; set; }

        [Range(-90.0, 90.0)]
        public double? Latitude { get; set; }

        [Range(-180.0, 180.0)]
        public double? Longitude { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (AvailableFrom.Date < DateTime.UtcNow.Date)
                yield return new ValidationResult(
                    "AvailableFrom geçmiş tarih olamaz.",
                    new[] { nameof(AvailableFrom) });
        }
    }
}
