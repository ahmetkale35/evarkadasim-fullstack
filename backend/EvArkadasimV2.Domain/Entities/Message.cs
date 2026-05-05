using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EvArkadasimV2.Domain.Enums;

namespace EvArkadasimV2.Domain.Entities
{
    public class Message
    {
        public int Id { get; set; }
        public int UserMatchId { get; set; }
        public UserMatch UserMatch { get; set; } = null!;
        public string SenderId { get; set; } = null!;
        public AppUser Sender { get; set; } = null!;
        public string Content { get; set; } = null!;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public MessageType Type { get; set; } = MessageType.Text;
        public bool IsRead { get; set; } = false;
    }
}
