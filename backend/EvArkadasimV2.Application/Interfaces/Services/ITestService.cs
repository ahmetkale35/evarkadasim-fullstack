using EvArkadasimV2.Application.DTOs.Test;

namespace EvArkadasimV2.Application.Interfaces.Services
{
    public interface ITestService
    {
        // Temel testi kaydeder
        Task<bool> SubmitBasicTestAsync(string userId, BasicTestResultDto dto);

        // Detaylı testi kaydeder
        Task<bool> SubmitDetailedTestAsync(string userId, DetailedTestResultDto dto);
    }
}