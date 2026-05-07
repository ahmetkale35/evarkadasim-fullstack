using EvArkadasimV2.Application.DTOs.Property;
using EvArkadasimV2.Domain.Enums;

namespace EvArkadasimV2.Application.Interfaces.Services
{
    public interface IPropertyService
    {
        Task<IEnumerable<PropertyDto>> GetListAsync(
            string? location,
            PropertyType? propertyType,
            decimal? maxPrice,
            int? bedrooms,
            bool? petsAllowed,
            int skip,
            int take);

        Task<PropertyDto> GetByIdAsync(int id);
        Task<PropertyDto> CreateAsync(string ownerId, CreatePropertyDto dto);
        Task<PropertyDto> UpdateAsync(int id, string currentUserId, UpdatePropertyDto dto);
        Task DeleteAsync(int id, string currentUserId);
        Task<IEnumerable<PropertyMapPinDto>> GetMapPinsAsync();
    }
}
