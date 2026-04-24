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

    public async Task<Message> AddAndReturnAsync(Guid id, Guid conversationId, Guid senderId, string content, DateTime createdAt, CancellationToken cancellationToken = default)
    {
        await dbContext.Database.ExecuteSqlInterpolatedAsync($@"
            INSERT INTO messages (id, conversation_id, sender_id, content, message_sequence, created_at)
            VALUES (
                {id}, {conversationId}, {senderId}, {content},
                COALESCE(
                    (SELECT MAX(message_sequence) FROM messages WHERE conversation_id = {conversationId}),
                    0
                ) + 1,
                {createdAt}
            )", cancellationToken);

        return await dbContext.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .FirstAsync(m => m.Id == id, cancellationToken);
    }

    public Task AddAsync(Message message, CancellationToken cancellationToken = default)
        => dbContext.Messages.AddAsync(message, cancellationToken).AsTask();
}
