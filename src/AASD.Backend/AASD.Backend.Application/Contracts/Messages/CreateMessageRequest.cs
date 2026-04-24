namespace AASD.Backend.Application.Contracts.Messages;

public sealed record CreateMessageRequest(string Content, Guid SenderId);
