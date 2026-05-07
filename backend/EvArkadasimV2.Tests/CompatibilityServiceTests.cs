using EvArkadasimV2.Application.Services;
using EvArkadasimV2.Domain.ValueObjects;
using Xunit;

namespace EvArkadasimV2.Tests
{
    // CompatibilityService: 6 boyutlu Manhattan Distance ile 0-100 arası uyumluluk skoru hesaplar.
    // Dış bağımlılığı yok — mock'a gerek yok, doğrudan new() ile test edilir.
    public class CompatibilityServiceTests
    {
        private readonly CompatibilityService _sut = new();

        // Yardımcı: tüm 6 boyutu aynı değere set eden kısa profil oluşturucu.
        private static BasicTestResults Scores(double v) => new()
        {
            SocialEnergy = v, OrderApproach = v, ConflictManagement = v,
            SharingStyle = v, LifeRhythm = v, CommunicationStyle = v
        };

        // Test tamamlanmamış kullanıcılar için null dönmeli — frontend kilit badge gösterir.
        [Fact]
        public void Calculate_BothNull_ReturnsNull()
        {
            var result = _sut.Calculate(null, null);
            Assert.Null(result);
        }

        [Fact]
        public void Calculate_CurrentNull_ReturnsNull()
        {
            var result = _sut.Calculate(null, Scores(3));
            Assert.Null(result);
        }

        [Fact]
        public void Calculate_CandidateNull_ReturnsNull()
        {
            var result = _sut.Calculate(Scores(3), null);
            Assert.Null(result);
        }

        // Tüm boyutlar eşitse fark=0 → skor %100 olmalı.
        [Fact]
        public void Calculate_IdenticalScores_Returns100()
        {
            var result = _sut.Calculate(Scores(3), Scores(3));
            Assert.Equal(100.0, result);
        }

        // 1-5 skalada maksimum zıtlık: her boyut 4 fark → ortalama 4 → skor %0.
        [Fact]
        public void Calculate_MaxOppositeScores_Returns0()
        {
            var result = _sut.Calculate(Scores(1), Scores(5));
            Assert.Equal(0.0, result);
        }

        // A→B ve B→A aynı skoru vermeli: algoritma yönden bağımsız olmalı.
        [Fact]
        public void Calculate_IsSymmetric()
        {
            var a = Scores(2);
            var b = Scores(4);
            Assert.Equal(_sut.Calculate(a, b), _sut.Calculate(b, a));
        }

        // Hiçbir girdi kombinasyonu 0-100 dışına taşmamalı.
        [Fact]
        public void Calculate_ScoreAlwaysBetween0And100()
        {
            var result = _sut.Calculate(Scores(1), Scores(5));
            Assert.InRange(result!.Value, 0.0, 100.0);
        }

        // Sadece 1 boyut farklı, diğer 5 eşit → kısmi skor ≈ 83.3 beklenir.
        [Fact]
        public void Calculate_OneDimensionDifferent_PartialScore()
        {
            var current   = new BasicTestResults { SocialEnergy = 1, OrderApproach = 3, ConflictManagement = 3, SharingStyle = 3, LifeRhythm = 3, CommunicationStyle = 3 };
            var candidate = new BasicTestResults { SocialEnergy = 5, OrderApproach = 3, ConflictManagement = 3, SharingStyle = 3, LifeRhythm = 3, CommunicationStyle = 3 };
            var result = _sut.Calculate(current, candidate);
            Assert.InRange(result!.Value, 83.0, 84.0);
        }
    }
}
