using EvArkadasimV2.Application.DTOs.Property;
using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Domain.Enums;

namespace EvArkadasimV2.Application.Services
{
    public class PropertyService : IPropertyService
    {
        private const int DefaultTake = 20;
        private const int MaxTake = 50;

        private readonly IPropertyRepository _propertyRepository;
        private readonly IUserRepository _userRepository;

        public PropertyService(IPropertyRepository propertyRepository, IUserRepository userRepository)
        {
            _propertyRepository = propertyRepository;
            _userRepository = userRepository;
        }

        public async Task<IEnumerable<PropertyDto>> GetListAsync(
            string? location,
            PropertyType? propertyType,
            decimal? maxPrice,
            int? bedrooms,
            bool? petsAllowed,
            int skip,
            int take)
        {
            if (skip < 0) skip = 0;
            if (take <= 0) take = DefaultTake;
            if (take > MaxTake) take = MaxTake;

            var properties = await _propertyRepository.GetFilteredAsync(
                location, propertyType, maxPrice, bedrooms, petsAllowed, skip, take);

            return properties.Select(MapToDto);
        }

        public async Task<PropertyDto> GetByIdAsync(int id)
        {
            var property = await _propertyRepository.GetByIdWithOwnerAsync(id);
            if (property == null)
                throw new NotFoundException($"İlan bulunamadı. Id: {id}");

            return MapToDto(property);
        }

        public async Task<PropertyDto> CreateAsync(string ownerId, CreatePropertyDto dto)
        {
            var property = new Property
            {
                Title = dto.Title,
                PriceAmount = dto.PriceAmount,
                Currency = dto.Currency,
                PricePeriod = dto.PricePeriod,
                Location = dto.Location,
                Bedrooms = dto.Bedrooms,
                Bathrooms = dto.Bathrooms,
                Images = dto.Images,
                Description = dto.Description ?? string.Empty,
                Amenities = dto.Amenities,
                AvailableFrom = dto.AvailableFrom,
                PropertyType = dto.PropertyType,
                Furnished = dto.Furnished,
                PetsAllowed = dto.PetsAllowed,
                SmokingAllowed = dto.SmokingAllowed,
                OwnerId = ownerId,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude
            };

            await _propertyRepository.AddAsync(property);
            await _propertyRepository.SaveChangesAsync();

            var owner = await _userRepository.GetUserWithProfileAsync(ownerId);
            if (owner?.Profile != null && owner.Profile.LookingFor != LookingFor.Roommate)
            {
                owner.Profile.LookingFor = LookingFor.Roommate;
                await _userRepository.SaveChangesAsync();
            }

            // Owner navigation property olmadan dönmemek için tekrar çek
            var created = await _propertyRepository.GetByIdWithOwnerAsync(property.Id);
            return MapToDto(created!);
        }

        public async Task<PropertyDto> UpdateAsync(int id, string currentUserId, UpdatePropertyDto dto)
        {
            var property = await _propertyRepository.GetByIdAsync(id);
            if (property == null)
                throw new NotFoundException($"İlan bulunamadı. Id: {id}");

            if (property.OwnerId != currentUserId)
                throw new ForbiddenException("Bu ilanı düzenleme yetkiniz yok.");

            property.Title = dto.Title;
            property.PriceAmount = dto.PriceAmount;
            property.Currency = dto.Currency;
            property.PricePeriod = dto.PricePeriod;
            property.Location = dto.Location;
            property.Bedrooms = dto.Bedrooms;
            property.Bathrooms = dto.Bathrooms;
            property.Images = dto.Images;
            property.Description = dto.Description ?? string.Empty;
            property.Amenities = dto.Amenities;
            property.AvailableFrom = dto.AvailableFrom;
            property.PropertyType = dto.PropertyType;
            property.Furnished = dto.Furnished;
            property.PetsAllowed = dto.PetsAllowed;
            property.SmokingAllowed = dto.SmokingAllowed;
            property.Latitude = dto.Latitude;
            property.Longitude = dto.Longitude;

            _propertyRepository.Update(property);
            await _propertyRepository.SaveChangesAsync();

            var updated = await _propertyRepository.GetByIdWithOwnerAsync(id);
            return MapToDto(updated!);
        }

        public async Task DeleteAsync(int id, string currentUserId)
        {
            var property = await _propertyRepository.GetByIdAsync(id);
            if (property == null)
                throw new NotFoundException($"İlan bulunamadı. Id: {id}");

            if (property.OwnerId != currentUserId)
                throw new ForbiddenException("Bu ilanı silme yetkiniz yok.");

            _propertyRepository.Remove(property);
            await _propertyRepository.SaveChangesAsync();
        }

        public async Task<IEnumerable<PropertyMapPinDto>> GetMapPinsAsync(string? city = null)
        {
            var properties = await _propertyRepository.GetWithCoordinatesAsync();

            if (!string.IsNullOrEmpty(city))
                properties = properties.Where(p =>
                    p.Location.Contains(city, StringComparison.OrdinalIgnoreCase)).ToList();

            return properties.Select(p => new PropertyMapPinDto
            {
                Id = p.Id,
                Latitude = p.Latitude!.Value,
                Longitude = p.Longitude!.Value,
                Title = p.Title,
                Price = $"{p.Currency}{p.PriceAmount:N0}/{p.PricePeriod}",
                Location = p.Location,
                PropertyType = p.PropertyType,
                OwnerId = p.OwnerId,
                OwnerName = $"{p.Owner?.Name} {p.Owner?.LastName}".Trim()
            });
        }

        private static PropertyDto MapToDto(Property p) => new()
        {
            Id = p.Id,
            Title = p.Title,
            Price = $"{p.Currency}{p.PriceAmount:N0}/{p.PricePeriod}",
            Location = p.Location,
            Bedrooms = p.Bedrooms,
            Bathrooms = p.Bathrooms,
            Images = p.Images ?? new List<string>(),
            Description = p.Description,
            Amenities = p.Amenities ?? new List<string>(),
            AvailableFrom = p.AvailableFrom,
            PropertyType = p.PropertyType,
            Furnished = p.Furnished,
            PetsAllowed = p.PetsAllowed,
            SmokingAllowed = p.SmokingAllowed,
            Latitude = p.Latitude,
            Longitude = p.Longitude,
            OwnerId = p.OwnerId,
            OwnerName = p.Owner?.Name ?? string.Empty
        };
    }
}
