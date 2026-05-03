using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvArkadasimV2.Domain.ValueObjects
{
    [Owned]
    public class DetailedTestResults
    {
        public List<int> DetailedSocialEnergy { get; set; } = new List<int>();
        public List<int> DetailedOrderApproach { get; set; } = new List<int>();
        public List<int> DetailedConflictManagement { get; set; } = new List<int>();
        public List<int> DetailedSharingStyle { get; set; } = new List<int>();
        public List<int> DetailedLifeRhythm { get; set; } = new List<int>();
        public List<int> DetailedCommunicationStyle { get; set; } = new();
    }
}
