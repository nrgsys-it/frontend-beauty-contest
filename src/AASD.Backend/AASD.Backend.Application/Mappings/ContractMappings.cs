using AASD.Backend.Application.Contracts.Conversations;
using AASD.Backend.Application.Contracts.Messages;
using AASD.Backend.Application.Contracts.Users;
using AASD.Backend.Domain.Entities;

namespace AASD.Backend.Application.Mappings;

internal static class ContractMappings
{
    public static UserDto ToDto(this User user)
        => new(user.Id, user.Name, user.Surname, user.Email, user.CreatedAt);

    public static ConversationParticipantDto ToParticipantDto(this User user)
        => new(user.Id, user.Name, user.Surname, user.Email);

    public static ConversationDto ToDto(this Conversation conversation)
        => new(
            conversation.Id,
            conversation.Title,
            conversation.CreatedAt,
            conversation.UpdatedAt,
            conversation.Participants
                .Select(participant => participant.User is not null
                    ? participant.User.ToParticipantDto()
                    : throw new InvalidOperationException($"Participant {participant.UserId} has no loaded User navigation property."))
                .ToList());

    public static MessageDto ToDto(this Message message)
    {
        if (message.Sender is null)
        {
            throw new InvalidOperationException("Message sender must be loaded before mapping.");
        }

        return new MessageDto(
            message.Id,
            message.Content,
            message.SenderId,
            message.ConversationId,
            message.CreatedAt,
            new MessageSenderDto(message.Sender.Id, message.Sender.Name, message.Sender.Surname, message.Sender.Email));
    }
}
