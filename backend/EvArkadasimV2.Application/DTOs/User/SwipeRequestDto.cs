using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvArkadasimV2.Application.DTOs.User
{
    public class SwipeRequestDto
    {
        public string ReceiverId { get; set; }
        public string SwipeType { get; set; } // "Like", "Pass", "SuperLike"
    }
}
