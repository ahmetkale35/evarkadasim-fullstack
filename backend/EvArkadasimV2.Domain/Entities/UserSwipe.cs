using EvArkadasimV2.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvArkadasimV2.Domain.Entities
{
    public class UserSwipe
    {
        public int Id { get; set; }
        public string SenderId { get; set; } = null!;
        public AppUser Sender { get; set; } = null!;
        public string ReceiverId { get; set; } = null!;
        public AppUser Receiver { get; set; } = null!;
        public SwipeType SwipeType { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
