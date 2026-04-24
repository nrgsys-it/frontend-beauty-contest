namespace AASD.Backend.Domain.Entities;

public sealed class User : Entity
{
    private User()
    {
    }

    public User(Guid id, string name, string surname, string email, string passwordHash, DateTime createdAt)
    {
        Id = id;
        Name = Require(name, nameof(name));
        Surname = Require(surname, nameof(surname));
        Email = Require(email, nameof(email)).ToLowerInvariant();
        PasswordHash = Require(passwordHash, nameof(passwordHash));
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public string Surname { get; private set; } = string.Empty;

    public string Email { get; private set; } = string.Empty;

    public string PasswordHash { get; private set; } = string.Empty;

    public DateTime CreatedAt { get; private set; }

    public ICollection<ConversationParticipant> ConversationParticipants { get; private set; } = new List<ConversationParticipant>();

    public ICollection<Message> Messages { get; private set; } = new List<Message>();

}
