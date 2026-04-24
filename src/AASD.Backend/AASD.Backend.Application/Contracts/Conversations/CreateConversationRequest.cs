namespace AASD.Backend.Application.Contracts.Conversations;

public sealed record CreateConversationRequest(string Title, IReadOnlyCollection<Guid> ParticipantIds);
