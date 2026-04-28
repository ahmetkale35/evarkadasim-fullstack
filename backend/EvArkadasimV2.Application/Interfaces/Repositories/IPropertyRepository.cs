using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Domain.Enums;

namespace EvArkadasimV2.Application.Interfaces.Repositories
{
    public interface IPropertyRepository : IGenericRepository<Property>
    {
        Task<List<Property>> GetFilteredAsync(
            string? location,
            PropertyType? propertyType,
            decimal? maxPrice,
            int? bedrooms,
            bool? petsAllowed,
            int skip,
            int take);

        Task<Property?> GetByIdWithOwnerAsync(int id);
    }
}
