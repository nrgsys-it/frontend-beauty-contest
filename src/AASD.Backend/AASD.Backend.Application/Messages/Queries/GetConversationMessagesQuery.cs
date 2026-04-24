using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Contracts.Messages;

namespace AASD.Backend.Application.Messages.Queries;

public sealed record GetConversationMessagesQuery(Guid ConversationId) : IQuery<IReadOnlyList<MessageDto>>;
