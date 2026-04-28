using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvArkadasimV2.Application.DTOs.Test
{
    public class BasicTestResultDto
    {
        // Bu DTO, kullanıcının test sonuçlarının temel bir özetini tutar. Her bir kategori için tek bir skor içerir.
        public double SocialEnergy { get; set; }
        public double OrderApproach { get; set; }
        public double ConflictManagement { get; set; }
        public double SharingStyle { get; set; }
        public double LifeRhythm { get; set; }
        public double CommunicationStyle { get; set; }
    }
}
