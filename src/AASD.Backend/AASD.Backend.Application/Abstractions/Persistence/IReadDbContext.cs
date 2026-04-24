using AASD.Backend.Domain.Entities;

namespace AASD.Backend.Application.Abstractions.Persistence;

/// <summary>
/// Read-only projection surface for query handlers.
/// Implemented by BackendDbContext in the Infrastructure layer.
/// Query handlers depend on this interface — never on BackendDbContext directly.
/// </summary>
public interface IReadDbContext
{
    IQueryable<User> Users { get; }
    IQueryable<Conversation> Conversations { get; }
    IQueryable<Message> Messages { get; }
    IQueryable<ConversationParticipant> ConversationParticipants { get; }
}
