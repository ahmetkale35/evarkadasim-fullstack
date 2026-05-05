using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace EvArkadasimV2.API.Hubs
{
    [Authorize]
    public class ChatHub : Hub<IChatClient>
    {
        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is not null)
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is not null)
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{userId}");

            await base.OnDisconnectedAsync(exception);
        }
    }
}
