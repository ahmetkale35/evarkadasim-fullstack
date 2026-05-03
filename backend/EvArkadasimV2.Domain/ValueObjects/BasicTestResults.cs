using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvArkadasimV2.Domain.ValueObjects
{
    [Owned]
    public class BasicTestResults
    {
        public double SocialEnergy { get; set; }
        public double OrderApproach { get; set; }
        public double ConflictManagement { get; set; }
        public double SharingStyle { get; set; }
        public double LifeRhythm { get; set; }
        public double CommunicationStyle { get; set; }

        // E/I: SocialEnergy, S/F: OrderApproach, D/H: ConflictManagement — eşik değeri 3.
        [NotMapped]
        public string PersonalityType
        {
            get
            {
                var e_i = SocialEnergy > 3 ? "E" : "I";
                var s_f = OrderApproach > 3 ? "S" : "F";
                var d_h = ConflictManagement > 3 ? "D" : "H";
                return $"{e_i}{s_f}{d_h}";
            }
        }
    }

}