using AASD.Backend.Domain.Entities;

namespace AASD.Backend.Application.Abstractions.Persistence;

public interface IMessageRepository
{
    Task<IReadOnlyList<Message>> ListByConversationAsync(Guid conversationId, CancellationToken cancellationToken = default);

    Task<long> GetNextMessageSequenceAsync(Guid conversationId, CancellationToken cancellationToken = default);

    Task AddAsync(Message message, CancellationToken cancellationToken = default);
}
