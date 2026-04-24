using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Contracts.Conversations;

namespace AASD.Backend.Application.Conversations.Commands;

public sealed record CreateConversationCommand(CreateConversationRequest Request) : ICommand<ConversationDto>;
