using EvArkadasimV2.Application.DTOs.User;

namespace EvArkadasimV2.Application.Interfaces.Services
{
    public interface IProfileService
    {
        // Kullanıcının profilini ID'sine göre getirir
        Task<UserProfileDto> GetProfileAsync(string userId);

        // Kullanıcının profilini günceller
        Task UpdateProfileAsync(string userId, UpdateProfileDto updateDto);
    }
}