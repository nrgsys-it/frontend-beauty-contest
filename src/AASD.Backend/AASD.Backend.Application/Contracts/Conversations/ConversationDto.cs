namespace AASD.Backend.Application.Contracts.Conversations;

public sealed record ConversationDto(
    Guid Id,
    string Title,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<ConversationParticipantDto> Participants);
