using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvArkadasimV2.Application.DTOs.Chat
{
    public class SendMessageDto
    {
        public int MatchId { get; set; }
        public string Content { get; set; }
        public string Type { get; set; } // "text", "image", "gif"
    }
}
