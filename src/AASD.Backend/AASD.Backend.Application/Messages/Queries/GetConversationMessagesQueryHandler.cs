using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Abstractions.Persistence;
using AASD.Backend.Application.Contracts.Messages;
using Microsoft.EntityFrameworkCore;

namespace AASD.Backend.Application.Messages.Queries;

public sealed class GetConversationMessagesQueryHandler(IReadDbContext readDb)
    : IQueryHandler<GetConversationMessagesQuery, IReadOnlyList<MessageDto>>
{
    public async Task<IReadOnlyList<MessageDto>> HandleAsync(GetConversationMessagesQuery query, CancellationToken cancellationToken = default)
    {
        var exists = await readDb.Conversations
            .AsNoTracking()
            .AnyAsync(c => c.Id == query.ConversationId, cancellationToken);

        if (!exists)
        {
            throw new KeyNotFoundException("Conversation not found.");
        }

        return await readDb.Messages
            .AsNoTracking()
            .Where(m => m.ConversationId == query.ConversationId)
            .OrderBy(m => m.MessageSequence)
            .Select(m => new MessageDto(
                m.Id,
                m.Content,
                m.SenderId,
                m.ConversationId,
                m.CreatedAt,
                new MessageSenderDto(
                    m.Sender!.Id,
                    m.Sender.Name,
                    m.Sender.Surname,
                    m.Sender.Email)))
            .ToListAsync(cancellationToken);
    }
}
