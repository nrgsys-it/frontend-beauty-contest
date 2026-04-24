using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Abstractions.Persistence;
using AASD.Backend.Application.Contracts.Messages;
using AASD.Backend.Application.Mappings;

namespace AASD.Backend.Application.Messages.Queries;

public sealed class GetConversationMessagesQueryHandler(
    IConversationRepository conversationRepository,
    IMessageRepository messageRepository)
    : IQueryHandler<GetConversationMessagesQuery, IReadOnlyList<MessageDto>>
{
    public async Task<IReadOnlyList<MessageDto>> HandleAsync(GetConversationMessagesQuery query, CancellationToken cancellationToken = default)
    {
        var conversation = await conversationRepository.GetByIdWithParticipantsAsync(query.ConversationId, cancellationToken);
        if (conversation is null)
        {
            throw new KeyNotFoundException("Conversation not found.");
        }

        var messages = await messageRepository.ListByConversationAsync(query.ConversationId, cancellationToken);
        return messages.Select(message => message.ToDto()).ToList();
    }
}
