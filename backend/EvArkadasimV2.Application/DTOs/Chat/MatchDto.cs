using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvArkadasimV2.Application.DTOs.User;

namespace EvArkadasimV2.Application.DTOs.Chat
{
    public class MatchDto
    {
        public string Id { get; set; }
        public UserProfileDto User { get; set; } // Karşı tarafın profili
        public DateTime MatchedAt { get; set; }
        public MessageDto? LastMessage { get; set; }
        public bool IsNewMatch { get; set; }
        public double CompatibilityScore { get; set; }
    }
}
