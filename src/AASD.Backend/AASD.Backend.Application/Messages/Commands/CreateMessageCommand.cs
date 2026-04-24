using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Contracts.Messages;

namespace AASD.Backend.Application.Messages.Commands;

public sealed record CreateMessageCommand(Guid ConversationId, CreateMessageRequest Request) : ICommand<MessageDto>;
