using AASD.Backend.Domain.Entities;

namespace AASD.Backend.Application.Abstractions.Persistence;

public interface IMessageRepository
{
    Task<IReadOnlyList<Message>> ListByConversationAsync(Guid conversationId, CancellationToken cancellationToken = default);

    Task<Message> AddAndReturnAsync(Guid id, Guid conversationId, Guid senderId, string content, DateTime createdAt, CancellationToken cancellationToken = default);

    Task AddAsync(Message message, CancellationToken cancellationToken = default);
}
