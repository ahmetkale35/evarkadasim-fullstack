using EvArkadasimV2.Application.DTOs.User;
using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Domain.Enums;

namespace EvArkadasimV2.Application.Services
{
    public class FeedService : IFeedService
    {
        private const int DefaultTake = 20;
        private const int MaxTake = 50;
        private static readonly TimeSpan CacheExpiry = TimeSpan.FromMinutes(5);

        private readonly IUserRepository _userRepository;
        private readonly ICompatibilityService _compatibilityService;
        private readonly ICacheService _cache;

        public FeedService(
            IUserRepository userRepository,
            ICompatibilityService compatibilityService,
            ICacheService cache)
        {
            _userRepository = userRepository;
            _compatibilityService = compatibilityService;
            _cache = cache;
        }

        public async Task<PagedFeedDto> GetFeedAsync(string currentUserId, int skip, int take)
        {
            if (skip < 0) skip = 0;
            if (take <= 0) take = DefaultTake;
            if (take > MaxTake) take = MaxTake;

            var cacheKey = $"feed:{currentUserId}:v2";
            var sortedDtos = await _cache.GetAsync<List<UserSummaryDto>>(cacheKey);

            if (sortedDtos is null)
            {
                var currentUser = await _userRepository.GetUserWithProfileAsync(currentUserId, tracking: false);
                var currentScores = currentUser?.Profile?.FinalScores;
                var currentCity = currentUser?.Profile?.Location?.City;
                var currentLookingFor = currentUser?.Profile?.LookingFor;
                var candidates = await _userRepository.GetFeedCandidatesWithLikeStatusAsync(currentUserId);

                var filtered = string.IsNullOrEmpty(currentCity)
                    ? candidates
                    : candidates.Where(x => string.Equals(
                        x.User.Profile?.Location?.City, currentCity, StringComparison.OrdinalIgnoreCase));

                // Ev sahibi sadece ev arayanları görür; ev arıyor ise herkesi görür
                if (currentLookingFor == LookingFor.Roommate)
                    filtered = filtered.Where(x => x.User.Profile?.LookingFor == LookingFor.Room);

                sortedDtos = filtered
                    .Select(item =>
                    {
                        var dto = MapToDto(item.User);
                        dto.Compatibility = _compatibilityService.Calculate(currentScores, item.User.Profile?.FinalScores);

                        var daysSinceActive = (DateTime.UtcNow - item.User.Profile!.LastActive).TotalDays;
                        var activityScore = daysSinceActive switch
                        {
                            < 7   => 1.0,
                            < 30  => 0.5,
                            < 90  => 0.25,
                            _     => 0.0
                        };

                        var photos = item.User.Profile.Photos ?? new List<string>();
                        var profileScore = (photos.Count > 0 ? 5 : 0)
                                         + (!string.IsNullOrEmpty(item.User.Profile.Bio) ? 3 : 0)
                                         + ((item.User.Profile.Interests?.Count ?? 0) >= 3 ? 2 : 0);

                        var finalScore = item.LikeWeight * 40.0
                                       + (dto.Compatibility ?? 0) * 0.35
                                       + activityScore * 15.0
                                       + profileScore;

                        return (Dto: dto, Score: finalScore);
                    })
                    .OrderByDescending(x => x.Score)
                    .Select(x => x.Dto)
                    .ToList();

                await _cache.SetAsync(cacheKey, sortedDtos, CacheExpiry);
            }

            var totalCount = sortedDtos.Count;
            var users = sortedDtos.Skip(skip).Take(take).ToList();

            return new PagedFeedDto
            {
                Users = users,
                Skip = skip,
                Take = take,
                TotalCount = totalCount,
                HasMore = skip + take < totalCount
            };
        }

        public async Task<UserSummaryDto?> GetUserByIdAsync(string currentUserId, string targetUserId)
        {
            var target = await _userRepository.GetUserWithProfileAsync(targetUserId, tracking: false);
            if (target?.Profile == null) return null;

            var currentUser = await _userRepository.GetUserWithProfileAsync(currentUserId, tracking: false);
            var dto = MapToDto(target);
            dto.Compatibility = _compatibilityService.Calculate(currentUser?.Profile?.FinalScores, target.Profile.FinalScores);
            return dto;
        }

        private static UserSummaryDto MapToDto(AppUser u) => new()
        {
            Id = u.Id,
            Name = $"{u.Name ?? ""} {u.LastName ?? ""}".Trim(),
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
                : null,
            HasProperty = u.Properties?.Any() ?? false
        };
    }
}
