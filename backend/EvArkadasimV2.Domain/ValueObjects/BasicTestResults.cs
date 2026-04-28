using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvArkadasimV2.Domain.ValueObjects
{
    // Bu sınıf, temel test sonuçlarını temsil eder
    // ve kişilik tipini hesaplamak için gerekli özellikleri içerir.
    // Kişilik tipi, sosyal enerji, düzen yaklaşımı ve çatışma yönetimi
    // gibi faktörlere dayanarak belirlenir.
   

    [Owned]
    public class BasicTestResults
    {
        public double SocialEnergy { get; set; }
        public double OrderApproach { get; set; }
        public double ConflictManagement { get; set; }
        public double SharingStyle { get; set; }
        public double LifeRhythm { get; set; }
        public double CommunicationStyle { get; set; }


        // Kişilik tipi, sosyal enerji, düzen yaklaşımı ve çatışma yönetimi gibi faktörlere dayanarak belirlenir.
        [NotMapped]
        public string PersonalityType
        {
            get
            {
                // extroversion (E) veya introversion (I) türkçe karşılıkları: dışa dönüklük (E) veya içe dönüklük (I)
                var e_i = SocialEnergy > 3 ? "E" : "I";
                // sensing (S) veya feeling (F) türkçe karşılıkları: algılama (S) veya hissetme (F)
                var s_f = OrderApproach > 3 ? "S" : "F";
                // judging (J) veya perceiving (P) türkçe karşılıkları: yargılama (J) veya algılama (P)
                var d_h = ConflictManagement > 3 ? "D" : "H";
                
                return $"{e_i}{s_f}{d_h}";
            }
        }
    }

}