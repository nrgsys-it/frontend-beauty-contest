namespace AASD.Backend.Domain.Entities;

public sealed class Message
{
    private Message()
    {
    }

    public Message(Guid id, Guid conversationId, Guid senderId, string content, long messageSequence, DateTime createdAt)
    {
        Id = id;
        ConversationId = conversationId;
        SenderId = senderId;
        Content = Require(content, nameof(content));
        MessageSequence = messageSequence;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }

    public string Content { get; private set; } = string.Empty;

    public Guid SenderId { get; private set; }

    public Guid ConversationId { get; private set; }

    public DateTime CreatedAt { get; private set; }

    public long MessageSequence { get; private set; }

    public User? Sender { get; private set; }

    public Conversation? Conversation { get; private set; }

    private static string Require(string value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException($"{fieldName} is required.", fieldName);
        }

        return value.Trim();
    }
}
