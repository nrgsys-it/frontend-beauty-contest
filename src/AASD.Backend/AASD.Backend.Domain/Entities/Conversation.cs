namespace AASD.Backend.Domain.Entities;

public sealed class Conversation
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

    public void Touch(DateTime updatedAt)
    {
        UpdatedAt = updatedAt;
    }

    private static string Require(string value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException($"{fieldName} is required.", fieldName);
        }

        return value.Trim();
    }
}
