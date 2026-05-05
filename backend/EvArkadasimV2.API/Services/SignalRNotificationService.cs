using EvArkadasimV2.API.Hubs;
using EvArkadasimV2.Application.DTOs.Chat;
using EvArkadasimV2.Application.Interfaces.Services;
using Microsoft.AspNetCore.SignalR;

namespace EvArkadasimV2.API.Services
{
    public class SignalRNotificationService : INotificationService
    {
        private readonly IHubContext<ChatHub, IChatClient> _hub;

        public SignalRNotificationService(IHubContext<ChatHub, IChatClient> hub)
            => _hub = hub;

        public Task SendMessageAsync(string recipientUserId, MessageDto message)
            => _hub.Clients.Group($"user-{recipientUserId}").ReceiveMessage(message);

        public Task SendMatchAsync(string userId1, string userId2, MatchDto match)
            => Task.WhenAll(
                _hub.Clients.Group($"user-{userId1}").MatchCreated(match),
                _hub.Clients.Group($"user-{userId2}").MatchCreated(match));
    }
}
