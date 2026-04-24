using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Contracts.Conversations;

namespace AASD.Backend.Application.Conversations.Queries;

public sealed record GetConversationsQuery : IQuery<IReadOnlyList<ConversationDto>>;
