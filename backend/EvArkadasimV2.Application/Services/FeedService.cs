using EvArkadasimV2.Application.DTOs.User;
using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Domain.Entities;

namespace EvArkadasimV2.Application.Services
{
    public class FeedService : IFeedService
    {
        // DoS koruması: client çok büyük take değeri gönderse bile burada clamp ediliyor.
        private const int DefaultTake = 20;
        private const int MaxTake = 50;

        private readonly IUserRepository _userRepository;
        private readonly ICompatibilityService _compatibilityService;

        public FeedService(IUserRepository userRepository, ICompatibilityService compatibilityService)
        {
            _userRepository = userRepository;
            _compatibilityService = compatibilityService;
        }

        public async Task<IEnumerable<UserSummaryDto>> GetFeedAsync(string currentUserId, int skip, int take)
        {
            if (skip < 0) skip = 0;
            if (take <= 0) take = DefaultTake;
            if (take > MaxTake) take = MaxTake;

            var currentUser = await _userRepository.GetUserWithProfileAsync(currentUserId, tracking: false);
            var currentScores = currentUser?.Profile?.FinalScores;

            var candidates = await _userRepository.GetFeedCandidatesWithLikeStatusAsync(currentUserId);

            // Sıralama: Like-boost DESC → Compatibility DESC → LastActive DESC
            // Sayfalama en sonda — compatibility hesaplandıktan sonra uygulanır.
            return candidates
                .Select(item =>
                {
                    var dto = MapToDto(item.User);
                    dto.Compatibility = _compatibilityService.Calculate(currentScores, item.User.Profile?.FinalScores);
                    return (Dto: dto, item.HasLikedCurrentUser);
                })
                .OrderByDescending(x => x.HasLikedCurrentUser)
                .ThenByDescending(x => x.Dto.Compatibility)
                .ThenByDescending(x => x.Dto.LastActive)
                .Skip(skip)
                .Take(take)
                .Select(x => x.Dto);
        }

        private static UserSummaryDto MapToDto(AppUser u) => new()
        {
            Id = u.Id,
            Name = u.Name ?? string.Empty,
            Age = u.Profile.Age,
            Bio = u.Profile.Bio,
            Budget = u.Profile.Budget,
            MoveInDate = u.Profile.MoveInDate,
            Lifestyle = u.Profile.Lifestyle ?? new List<string>(),
            Photos = u.Profile.Photos ?? new List<string>(),
            Interests = u.Profile.Interests ?? new List<string>(),
            Occupation = u.Profile.Occupation,
            Education = u.Profile.Education,
            RoomType = u.Profile.RoomType,
            LookingFor = u.Profile.LookingFor,
            IsVerified = u.Profile.IsVerified,
            LastActive = u.Profile.LastActive,
            Cleanliness = u.Profile.Cleanliness,
            SocialLevel = u.Profile.SocialLevel,
            Location = u.Profile.Location != null
                ? new LocationDto { City = u.Profile.Location.City, Distance = u.Profile.Location.Distance ?? 0 }
                : null
        };
    }
}
