using EvArkadasimV2.Domain.ValueObjects;

namespace EvArkadasimV2.Application.Interfaces.Services
{
    public interface ICompatibilityService
    {
        double Calculate(BasicTestResults? current, BasicTestResults? candidate);
    }
}
