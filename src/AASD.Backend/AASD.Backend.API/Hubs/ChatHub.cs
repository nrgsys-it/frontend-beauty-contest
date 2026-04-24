using Microsoft.AspNetCore.SignalR;

namespace AASD.Backend.API.Hubs;

public sealed class ChatHub : Hub
{
    public static string ConversationGroup(Guid conversationId) => $"conversation:{conversationId:N}";

    public Task JoinConversation(Guid conversationId, Guid userId)
    {
        _ = userId;
        return Groups.AddToGroupAsync(Context.ConnectionId, ConversationGroup(conversationId));
    }

    public Task LeaveConversation(Guid conversationId)
        => Groups.RemoveFromGroupAsync(Context.ConnectionId, ConversationGroup(conversationId));
}
