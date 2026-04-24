namespace AASD.Backend.Domain.Entities;

public sealed class ConversationParticipant
{
    private ConversationParticipant()
    {
    }

    public ConversationParticipant(Guid conversationId, Guid userId, DateTime joinedAt)
    {
        ConversationId = conversationId;
        UserId = userId;
        JoinedAt = joinedAt;
    }

    public Guid ConversationId { get; private set; }

    public Guid UserId { get; private set; }

    public DateTime JoinedAt { get; private set; }

    public Conversation? Conversation { get; private set; }

    public User? User { get; private set; }
}
