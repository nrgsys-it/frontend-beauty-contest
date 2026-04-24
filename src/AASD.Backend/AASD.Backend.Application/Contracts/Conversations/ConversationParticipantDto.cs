namespace AASD.Backend.Application.Contracts.Conversations;

public sealed record ConversationParticipantDto(Guid Id, string Name, string Surname, string Email);
