using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Abstractions.Persistence;
using AASD.Backend.Application.Contracts.Conversations;
using Microsoft.EntityFrameworkCore;

namespace AASD.Backend.Application.Conversations.Queries;

public sealed class GetConversationsQueryHandler(IReadDbContext readDb)
    : IQueryHandler<GetConversationsQuery, IReadOnlyList<ConversationDto>>
{
    public async Task<IReadOnlyList<ConversationDto>> HandleAsync(GetConversationsQuery query, CancellationToken cancellationToken = default)
    {
        return await readDb.Conversations
            .AsNoTracking()
            .Select(c => new ConversationDto(
                c.Id,
                c.Title,
                c.CreatedAt,
                c.UpdatedAt,
                c.Participants
                    .Where(p => p.User != null)
                    .Select(p => new ConversationParticipantDto(
                        p.User!.Id,
                        p.User.Name,
                        p.User.Surname,
                        p.User.Email))
                    .ToList()))
            .ToListAsync(cancellationToken);
    }
}
