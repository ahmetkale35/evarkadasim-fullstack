using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Domain.Enums;
using EvArkadasimV2.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EvArkadasimV2.Infrastructure.Repositories
{
    public class PropertyRepository : GenericRepository<Property>, IPropertyRepository
    {
        public PropertyRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<List<Property>> GetFilteredAsync(
            string? location,
            PropertyType? propertyType,
            decimal? maxPrice,
            int? bedrooms,
            bool? petsAllowed,
            int skip,
            int take)
        {
            var query = _context.Properties
                .AsNoTracking()
                .Include(p => p.Owner)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(location))
                query = query.Where(p => p.Location.Contains(location));

            if (propertyType.HasValue)
                query = query.Where(p => p.PropertyType == propertyType.Value);

            if (maxPrice.HasValue)
                query = query.Where(p => p.PriceAmount <= maxPrice.Value);

            if (bedrooms.HasValue)
                query = query.Where(p => p.Bedrooms == bedrooms.Value);

            if (petsAllowed.HasValue)
                query = query.Where(p => p.PetsAllowed == petsAllowed.Value);

            return await query
                .OrderByDescending(p => p.AvailableFrom)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<Property?> GetByIdWithOwnerAsync(int id)
        {
            return await _context.Properties
                .AsNoTracking()
                .Include(p => p.Owner)
                .FirstOrDefaultAsync(p => p.Id == id);
        }
    }
}
