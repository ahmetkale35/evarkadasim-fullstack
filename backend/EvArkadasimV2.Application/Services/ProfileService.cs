using EvArkadasimV2.Application.DTOs.Test;
using EvArkadasimV2.Application.DTOs.User;
using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Application.Interfaces.Services;

namespace EvArkadasimV2.Application.Services
{
    public class ProfileService : IProfileService
    {
        private readonly IUserRepository _userRepository;

        public ProfileService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
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
                Age = user.Profile.Age,
                Bio = user.Profile.Bio,
                Budget = user.Profile.Budget,
                Occupation = user.Profile.Occupation,
                Education = user.Profile.Education,
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
                CharacterProfile = user.Profile.FinalScores != null ? new BasicTestResultDto
                {
                    SocialEnergy = user.Profile.FinalScores.SocialEnergy,
                    OrderApproach = user.Profile.FinalScores.OrderApproach,
                    ConflictManagement = user.Profile.FinalScores.ConflictManagement,
                    SharingStyle = user.Profile.FinalScores.SharingStyle,
                    LifeRhythm = user.Profile.FinalScores.LifeRhythm,
                    CommunicationStyle = user.Profile.FinalScores.CommunicationStyle
                } : null
            };
        }

        public async Task<bool> UpdateProfileAsync(string userId, UpdateProfileDto updateDto)
        {
            var user = await _userRepository.GetUserWithProfileAsync(userId, tracking: true);

            if (user?.Profile == null)
                throw new NotFoundException("Kullanıcı bulunamadı.");

            // Her alan bağımsız olarak null kontrolüne tabi: null gelen alan atlanır,
            // bu sayede client tüm alanları göndermek zorunda kalmaz.
            if (updateDto.Bio != null) user.Profile.Bio = updateDto.Bio;
            if (updateDto.Budget != null) user.Profile.Budget = updateDto.Budget;
            if (updateDto.MoveInDate != null) user.Profile.MoveInDate = updateDto.MoveInDate;
            if (updateDto.Lifestyle != null) user.Profile.Lifestyle = updateDto.Lifestyle;
            if (updateDto.Interests != null) user.Profile.Interests = updateDto.Interests;
            if (updateDto.Photos != null) user.Profile.Photos = updateDto.Photos;
            if (updateDto.Cleanliness.HasValue) user.Profile.Cleanliness = updateDto.Cleanliness.Value;
            if (updateDto.SocialLevel.HasValue) user.Profile.SocialLevel = updateDto.SocialLevel.Value;
            if (updateDto.IsOnlineStatusVisible.HasValue) user.Profile.IsOnlineStatusVisible = updateDto.IsOnlineStatusVisible.Value;
            if (updateDto.NotificationsEnabled.HasValue) user.Profile.NotificationsEnabled = updateDto.NotificationsEnabled.Value;

            _userRepository.Update(user);
            return await _userRepository.SaveChangesAsync();
        }
    }
}
