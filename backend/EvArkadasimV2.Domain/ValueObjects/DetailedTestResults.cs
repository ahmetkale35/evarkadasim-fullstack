using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvArkadasimV2.Domain.ValueObjects
{
    // Bu sınıf, detaylı test sonuçlarını temsil eder
    [Owned]
    public class DetailedTestResults
    {
        // Detaylı test sonuçları, temel test sonuçlarına ek olarak, her bir faktörün alt boyutlarını içerir.
        public List<int> DetailedSocialEnergy { get; set; } = new List<int>();
        public List<int> DetailedOrderApproach { get; set; } = new List<int>();
        public List<int> DetailedConflictManagement { get; set; } = new List<int>();
        public List<int> DetailedSharingStyle { get; set; } = new List<int>();
        public List<int> DetailedLifeRhythm { get; set; } = new List<int>();
        public List<int> DetailedCommunicationStyle { get; set; } = new();
    }
}
