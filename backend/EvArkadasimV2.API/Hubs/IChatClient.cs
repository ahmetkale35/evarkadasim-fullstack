using EvArkadasimV2.Application.DTOs.Chat;

namespace EvArkadasimV2.API.Hubs
{
    public interface IChatClient
    {
        Task ReceiveMessage(MessageDto message);
        Task MatchCreated(MatchDto match);
    }
}
