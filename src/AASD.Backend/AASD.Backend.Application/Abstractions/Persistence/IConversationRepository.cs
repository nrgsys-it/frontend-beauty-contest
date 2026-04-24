using AASD.Backend.Domain.Entities;

namespace AASD.Backend.Application.Abstractions.Persistence;

public interface IConversationRepository
{
    Task<IReadOnlyList<Conversation>> ListWithParticipantsAsync(CancellationToken cancellationToken = default);

    Task<Conversation?> GetByIdWithParticipantsAsync(Guid conversationId, CancellationToken cancellationToken = default);

    Task AddAsync(Conversation conversation, CancellationToken cancellationToken = default);
}
