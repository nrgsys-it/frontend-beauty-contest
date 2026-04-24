using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Abstractions.Persistence;
using AASD.Backend.Application.Contracts.Conversations;
using AASD.Backend.Application.Mappings;

namespace AASD.Backend.Application.Conversations.Queries;

public sealed class GetConversationsQueryHandler(IConversationRepository conversationRepository)
    : IQueryHandler<GetConversationsQuery, IReadOnlyList<ConversationDto>>
{
    public async Task<IReadOnlyList<ConversationDto>> HandleAsync(GetConversationsQuery query, CancellationToken cancellationToken = default)
    {
        var conversations = await conversationRepository.ListWithParticipantsAsync(cancellationToken);
        return conversations.Select(conversation => conversation.ToDto()).ToList();
    }
}
