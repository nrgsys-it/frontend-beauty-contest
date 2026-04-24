using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Abstractions.Persistence;
using AASD.Backend.Application.Abstractions.Validation;
using AASD.Backend.Application.Contracts.Messages;
using AASD.Backend.Application.Mappings;

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

        conversation.EnsureSenderIsParticipant(command.Request.SenderId);

        var sender = await userRepository.GetByIdAsync(command.Request.SenderId, cancellationToken);
        if (sender is null)
        {
            throw new KeyNotFoundException("Sender not found.");
        }

        var now = DateTime.UtcNow;
        var messageId = Guid.NewGuid();

        var createdMessage = await messageRepository.AddAndReturnAsync(
            messageId,
            command.ConversationId,
            command.Request.SenderId,
            command.Request.Content,
            now,
            cancellationToken);

        conversation.Touch(now);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return createdMessage.ToDto();
    }
}
