using AASD.Backend.Application.Abstractions.Persistence;
using AASD.Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AASD.Backend.Infrastructure.Persistence.Repositories;

public sealed class MessageRepository(BackendDbContext dbContext) : IMessageRepository
{
    public async Task<IReadOnlyList<Message>> ListByConversationAsync(Guid conversationId, CancellationToken cancellationToken = default)
        => await dbContext.Messages
            .AsNoTracking()
            .Include(message => message.Sender)
            .Where(message => message.ConversationId == conversationId)
            .OrderBy(message => message.MessageSequence)
            .ToListAsync(cancellationToken);

    public async Task<long> GetNextMessageSequenceAsync(Guid conversationId, CancellationToken cancellationToken = default)
    {
        var maxValue = await dbContext.Messages
            .Where(message => message.ConversationId == conversationId)
            .MaxAsync(message => (long?)message.MessageSequence, cancellationToken);

        return (maxValue ?? 0) + 1;
    }

    public Task AddAsync(Message message, CancellationToken cancellationToken = default)
        => dbContext.Messages.AddAsync(message, cancellationToken).AsTask();
}
