using EvArkadasimV2.Application.DTOs.Test;
using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Domain.ValueObjects;

namespace EvArkadasimV2.Application.Services
{
    public class TestService : ITestService
    {
        private readonly IUserRepository _userRepository;

        public TestService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<bool> SubmitBasicTestAsync(string userId, BasicTestResultDto dto)
        {
            var user = await _userRepository.GetUserWithProfileAsync(userId, tracking: true);

            if (user?.Profile == null)
                throw new NotFoundException("Kullanıcı veya profil bulunamadı.");

            var testResults = new BasicTestResults
            {
                SocialEnergy = dto.SocialEnergy,
                OrderApproach = dto.OrderApproach,
                ConflictManagement = dto.ConflictManagement,
                SharingStyle = dto.SharingStyle,
                LifeRhythm = dto.LifeRhythm,
                CommunicationStyle = dto.CommunicationStyle
            };

            user.Profile.InitialBasicTestResults = testResults;

            // Detaylı test henüz çözülmemiş: FinalScores'u temel testle başlatıyoruz.
            // Eşleşme algoritması FinalScores üzerinden çalıştığı için bu değer her zaman dolu olmalı.
            // Ayrı instance: EF Core owned type aynı referansı iki property'ye atamayı desteklemez.
            user.Profile.FinalScores = new BasicTestResults
            {
                SocialEnergy = dto.SocialEnergy,
                OrderApproach = dto.OrderApproach,
                ConflictManagement = dto.ConflictManagement,
                SharingStyle = dto.SharingStyle,
                LifeRhythm = dto.LifeRhythm,
                CommunicationStyle = dto.CommunicationStyle
            };

            _userRepository.Update(user);
            return await _userRepository.SaveChangesAsync();
        }

        public async Task<bool> SubmitDetailedTestAsync(string userId, DetailedTestResultDto dto)
        {
            var user = await _userRepository.GetUserWithProfileAsync(userId, tracking: true);

            if (user?.Profile == null)
                throw new NotFoundException("Kullanıcı veya profil bulunamadı.");

            // Detaylı test, temel testin üzerine yazılmalı. Aksi takdirde kullanıcı
            // temel testi atlamış ve eşleşme skoru hiç hesaplanmamış olur.
            if (user.Profile.InitialBasicTestResults == null)
                throw new DomainException("Detaylı testi göndermeden önce temel testi tamamlamalısınız.");

            ValidateDetailedTestDto(dto);

            user.Profile.DetailedTestResults = new DetailedTestResults
            {
                DetailedSocialEnergy = dto.DetailedSocialEnergy,
                DetailedOrderApproach = dto.DetailedOrderApproach,
                DetailedConflictManagement = dto.DetailedConflictManagement,
                DetailedSharingStyle = dto.DetailedSharingStyle,
                DetailedLifeRhythm = dto.DetailedLifeRhythm,
                DetailedCommunicationStyle = dto.DetailedCommunicationStyle
            };

            // FinalScores, detaylı testin boyut ortalamalarına güncellenir.
            // Eşleşme algoritması bu tek skoru kullanır; ham liste verisi arşiv amaçlı saklanır.
            user.Profile.FinalScores = new BasicTestResults
            {
                SocialEnergy = dto.DetailedSocialEnergy.Average(),
                OrderApproach = dto.DetailedOrderApproach.Average(),
                ConflictManagement = dto.DetailedConflictManagement.Average(),
                SharingStyle = dto.DetailedSharingStyle.Average(),
                LifeRhythm = dto.DetailedLifeRhythm.Average(),
                CommunicationStyle = dto.DetailedCommunicationStyle.Average()
            };

            _userRepository.Update(user);
            return await _userRepository.SaveChangesAsync();
        }

        private static void ValidateDetailedTestDto(DetailedTestResultDto dto)
        {
            // Validation burada yapılır çünkü boş liste Average() çağrısında
            // InvalidOperationException fırlatır — bu hata client'a sızmamalı.
            if (!dto.DetailedSocialEnergy.Any()) throw new DomainException("SocialEnergy boyutu boş olamaz.");
            if (!dto.DetailedOrderApproach.Any()) throw new DomainException("OrderApproach boyutu boş olamaz.");
            if (!dto.DetailedConflictManagement.Any()) throw new DomainException("ConflictManagement boyutu boş olamaz.");
            if (!dto.DetailedSharingStyle.Any()) throw new DomainException("SharingStyle boyutu boş olamaz.");
            if (!dto.DetailedLifeRhythm.Any()) throw new DomainException("LifeRhythm boyutu boş olamaz.");
            if (!dto.DetailedCommunicationStyle.Any()) throw new DomainException("CommunicationStyle boyutu boş olamaz.");
        }
    }
}
