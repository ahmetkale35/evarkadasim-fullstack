using EvArkadasimV2.Application.DTOs.Test;
using EvArkadasimV2.Application.DTOs.User;
using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Domain.Enums;
using EvArkadasimV2.Domain.ValueObjects;

namespace EvArkadasimV2.Application.Services
{
    public class ProfileService : IProfileService
    {
        private readonly IUserRepository _userRepository;
        private readonly ICacheService _cache;
        private readonly IFileStorageService _storage;

        public ProfileService(IUserRepository userRepository, ICacheService cache, IFileStorageService storage)
        {
            _userRepository = userRepository;
            _cache = cache;
            _storage = storage;
        }

        public async Task<UserProfileDto> GetProfileAsync(string userId)
        {
            var user = await _userRepository.GetUserWithProfileAsync(userId, tracking: false);

            if (user?.Profile == null)
                throw new NotFoundException("Profil bulunamadı.");

            return new UserProfileDto
            {
                Id = user.Id,
                Name = user.Name ?? string.Empty,
                LastName = user.LastName,
                Age = user.Profile.Age,
                Bio = user.Profile.Bio,
                Budget = user.Profile.Budget,
                Occupation = user.Profile.Occupation,
                Education = user.Profile.Education,
                Location = user.Profile.Location != null
                    ? new LocationDto { City = user.Profile.Location.City, Distance = user.Profile.Location.Distance ?? 0 }
                    : null,
                RoomType = user.Profile.RoomType,
                LookingFor = user.Profile.LookingFor,
                IsVerified = user.Profile.IsVerified,
                Cleanliness = user.Profile.Cleanliness,
                SocialLevel = user.Profile.SocialLevel,
                MatchesCount = user.Profile.MatchesCount,
                LikedProfilesCount = user.Profile.LikedProfilesCount,
                Lifestyle = user.Profile.Lifestyle ?? new List<string>(),
                Photos = user.Profile.Photos ?? new List<string>(),
                Interests = user.Profile.Interests ?? new List<string>(),
                CharacterProfile = MapScores(user.Profile.FinalScores),
                InitialBasicTestResults = MapScores(user.Profile.InitialBasicTestResults),
                FinalScores = MapScores(user.Profile.FinalScores),
                HasProperty = user.Properties?.Any() ?? false,
                IsOnlineStatusVisible = user.Profile.IsOnlineStatusVisible,
                NotificationsEnabled = user.Profile.NotificationsEnabled
            };
        }

        public async Task UpdateProfileAsync(string userId, UpdateProfileDto updateDto)
        {
            var user = await _userRepository.GetUserWithProfileAsync(userId, tracking: true);

            if (user?.Profile == null)
                throw new NotFoundException("Kullanıcı bulunamadı.");

            // Her alan bağımsız olarak null kontrolüne tabi: null gelen alan atlanır,
            // bu sayede client tüm alanları göndermek zorunda kalmaz.
            if (updateDto.FirstName != null) user.Name = updateDto.FirstName;
            if (updateDto.LastName != null) user.LastName = updateDto.LastName;
            if (updateDto.Age.HasValue) user.Profile.Age = updateDto.Age.Value;
            if (updateDto.Occupation != null) user.Profile.Occupation = updateDto.Occupation;
            if (updateDto.Education != null) user.Profile.Education = updateDto.Education;
            if (updateDto.City != null)
            {
                user.Profile.Location ??= new Location();
                user.Profile.Location.City = updateDto.City;
            }
            if (updateDto.Bio != null) user.Profile.Bio = updateDto.Bio;
            if (updateDto.Budget != null) user.Profile.Budget = updateDto.Budget;
            if (updateDto.MoveInDate != null) user.Profile.MoveInDate = updateDto.MoveInDate;
            if (updateDto.Lifestyle != null) user.Profile.Lifestyle = updateDto.Lifestyle;
            if (updateDto.Interests != null) user.Profile.Interests = updateDto.Interests;
            if (updateDto.Photos != null)
            {
                var removed = (user.Profile.Photos ?? new List<string>())
                    .Except(updateDto.Photos).ToList();
                user.Profile.Photos = updateDto.Photos;
                foreach (var url in removed)
                    await _storage.DeleteAsync(url);
            }
            if (updateDto.Cleanliness.HasValue) user.Profile.Cleanliness = updateDto.Cleanliness.Value;
            if (updateDto.SocialLevel.HasValue) user.Profile.SocialLevel = updateDto.SocialLevel.Value;
            if (updateDto.IsOnlineStatusVisible.HasValue) user.Profile.IsOnlineStatusVisible = updateDto.IsOnlineStatusVisible.Value;
            if (updateDto.NotificationsEnabled.HasValue) user.Profile.NotificationsEnabled = updateDto.NotificationsEnabled.Value;
            if (updateDto.LookingFor.HasValue)
            {
                if (updateDto.LookingFor == LookingFor.Roommate && !(user.Properties?.Any() ?? false))
                    throw new DomainException("Ev sahibi olmak için önce bir ilan eklemelisiniz.");
                user.Profile.LookingFor = updateDto.LookingFor.Value;
            }

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();
            await _cache.RemoveAsync($"feed:{userId}:v2");
        }

        private static BasicTestResultDto? MapScores(EvArkadasimV2.Domain.ValueObjects.BasicTestResults? scores) =>
            scores == null ? null : new BasicTestResultDto
            {
                SocialEnergy = scores.SocialEnergy,
                OrderApproach = scores.OrderApproach,
                ConflictManagement = scores.ConflictManagement,
                SharingStyle = scores.SharingStyle,
                LifeRhythm = scores.LifeRhythm,
                CommunicationStyle = scores.CommunicationStyle
            };
    }
}
