using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Domain.ValueObjects;

namespace EvArkadasimV2.Application.Services
{
    public class CompatibilityService : ICompatibilityService
    {
        private const double MaxDiff = 4.0; // 1-5 ölçek: maksimum fark 4

        public double? Calculate(BasicTestResults? current, BasicTestResults? candidate)
        {
            if (current == null || candidate == null)
                return null;

            var totalDiff =
                Math.Abs(current.SocialEnergy - candidate.SocialEnergy) +
                Math.Abs(current.OrderApproach - candidate.OrderApproach) +
                Math.Abs(current.ConflictManagement - candidate.ConflictManagement) +
                Math.Abs(current.SharingStyle - candidate.SharingStyle) +
                Math.Abs(current.LifeRhythm - candidate.LifeRhythm) +
                Math.Abs(current.CommunicationStyle - candidate.CommunicationStyle);

            var avgDiff = totalDiff / 6.0;
            return Math.Round(Math.Max(0, ((MaxDiff - avgDiff) / MaxDiff) * 100), 1);
        }
    }
}
