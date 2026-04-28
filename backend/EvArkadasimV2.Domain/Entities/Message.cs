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
        public UserMatch UserMatch { get; set; }
        public string SenderId { get; set; }
        public AppUser Sender { get; set; }
        public string Content { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public MessageType Type { get; set; } = MessageType.Text;
        public bool IsRead { get; set; } = false;
    }
}
