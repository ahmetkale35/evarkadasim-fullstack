using System.Linq.Expressions;

namespace EvArkadasimV2.Application.Interfaces.Repositories
{
    public interface IGenericRepository<T> where T : class
    {
        Task<T?> GetByIdAsync(int id);
        Task<T?> GetByIdStringAsync(string id);

        IQueryable<T> GetAll(bool tracking = true);
        IQueryable<T> Where(Expression<Func<T, bool>> predicate, bool tracking = true);

        Task AddAsync(T entity);
        Task AddRangeAsync(IEnumerable<T> entities);

        void Update(T entity);
        void Remove(T entity);
        void RemoveRange(IEnumerable<T> entities);

        Task<bool> SaveChangesAsync();
    }
}