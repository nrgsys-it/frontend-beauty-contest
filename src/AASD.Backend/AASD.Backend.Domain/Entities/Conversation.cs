namespace AASD.Backend.Domain.Entities;

public sealed class Conversation : Entity
{
    private Conversation()
    {
    }

    public Conversation(Guid id, string title, DateTime createdAt)
    {
        Id = id;
        Title = Require(title, nameof(title));
        CreatedAt = createdAt;
        UpdatedAt = createdAt;
    }

    public Guid Id { get; private set; }

    public string Title { get; private set; } = string.Empty;

    public DateTime CreatedAt { get; private set; }

    public DateTime UpdatedAt { get; private set; }

    public ICollection<ConversationParticipant> Participants { get; private set; } = new List<ConversationParticipant>();

    public ICollection<Message> Messages { get; private set; } = new List<Message>();

    public void AddParticipant(Guid userId, DateTime joinedAt)
    {
        if (Participants.Any(participant => participant.UserId == userId))
        {
            return;
        }

        Participants.Add(new ConversationParticipant(Id, userId, joinedAt));
        Touch(joinedAt);
    }

    public void EnsureSenderIsParticipant(Guid senderId)
    {
        if (Participants.All(p => p.UserId != senderId))
        {
            throw new InvalidOperationException("Sender must be a participant of the conversation.");
        }
    }

    public void Touch(DateTime updatedAt)
    {
        UpdatedAt = updatedAt;
    }

}
