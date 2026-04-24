namespace AASD.Backend.Application.Contracts.Messages;

public sealed record MessageDto(
    Guid Id,
    string Content,
    Guid SenderId,
    Guid ConversationId,
    DateTime CreatedAt,
    MessageSenderDto Sender);
