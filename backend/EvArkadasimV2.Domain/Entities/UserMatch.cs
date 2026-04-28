using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvArkadasimV2.Domain.Entities
{
    public class UserMatch
    {
        public int Id { get; set; }
        public string User1Id { get; set; }
        public AppUser User1 { get; set; }
        public string User2Id { get; set; }
        public AppUser User2 { get; set; }

        public DateTime MatchedAt { get; set; } = DateTime.UtcNow;
        public bool User1HasSeen { get; set; } = false;
        public bool User2HasSeen { get; set; } = false;
        public double CompatibilityScore { get; set; }

        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }
}
