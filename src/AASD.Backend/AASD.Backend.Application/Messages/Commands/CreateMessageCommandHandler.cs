using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Abstractions.Persistence;
using AASD.Backend.Application.Abstractions.Validation;
using AASD.Backend.Application.Contracts.Messages;
using AASD.Backend.Application.Mappings;
using AASD.Backend.Domain.Entities;

namespace AASD.Backend.Application.Messages.Commands;

public sealed class CreateMessageCommandHandler(
    IRequestValidator<CreateMessageCommand> validator,
    IUserRepository userRepository,
    IConversationRepository conversationRepository,
    IMessageRepository messageRepository,
    IUnitOfWork unitOfWork)
    : ICommandHandler<CreateMessageCommand, MessageDto>
{
    public async Task<MessageDto> HandleAsync(CreateMessageCommand command, CancellationToken cancellationToken = default)
    {
        validator.ValidateAndThrow(command);

        var conversation = await conversationRepository.GetByIdWithParticipantsAsync(command.ConversationId, cancellationToken);
        if (conversation is null)
        {
            throw new KeyNotFoundException("Conversation not found.");
        }

        if (conversation.Participants.All(participant => participant.UserId != command.Request.SenderId))
        {
            throw new InvalidOperationException("Sender must be a participant in the conversation.");
        }

        var sender = await userRepository.GetByIdAsync(command.Request.SenderId, cancellationToken);
        if (sender is null)
        {
            throw new KeyNotFoundException("Sender not found.");
        }

        var now = DateTime.UtcNow;
        var nextSequence = await messageRepository.GetNextMessageSequenceAsync(command.ConversationId, cancellationToken);
        var message = new Message(
            Guid.NewGuid(),
            command.ConversationId,
            command.Request.SenderId,
            command.Request.Content,
            nextSequence,
            now);

        await messageRepository.AddAsync(message, cancellationToken);
        conversation.Touch(now);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var persisted = await messageRepository.ListByConversationAsync(command.ConversationId, cancellationToken);
        var created = persisted.LastOrDefault(item => item.Id == message.Id)
            ?? throw new InvalidOperationException("Persisted message could not be reloaded.");

        return created.ToDto();
    }
}
