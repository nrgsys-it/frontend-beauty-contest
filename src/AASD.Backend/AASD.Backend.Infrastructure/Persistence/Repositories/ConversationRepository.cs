using AASD.Backend.Application.Abstractions.Persistence;
using AASD.Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AASD.Backend.Infrastructure.Persistence.Repositories;

public sealed class ConversationRepository(BackendDbContext dbContext) : IConversationRepository
{
    public async Task<IReadOnlyList<Conversation>> ListWithParticipantsAsync(CancellationToken cancellationToken = default)
        => await dbContext.Conversations
            .AsNoTracking()
            .Include(conversation => conversation.Participants)
            .ThenInclude(participant => participant.User)
            .OrderByDescending(conversation => conversation.UpdatedAt)
            .ToListAsync(cancellationToken);

    public Task<Conversation?> GetByIdWithParticipantsAsync(Guid conversationId, CancellationToken cancellationToken = default)
        => dbContext.Conversations
            .Include(conversation => conversation.Participants)
            .ThenInclude(participant => participant.User)
            .FirstOrDefaultAsync(conversation => conversation.Id == conversationId, cancellationToken);

    public Task AddAsync(Conversation conversation, CancellationToken cancellationToken = default)
        => dbContext.Conversations.AddAsync(conversation, cancellationToken).AsTask();
}
