using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Abstractions.Persistence;
using AASD.Backend.Application.Abstractions.Validation;
using AASD.Backend.Application.Contracts.Conversations;
using AASD.Backend.Application.Mappings;
using AASD.Backend.Domain.Entities;

namespace AASD.Backend.Application.Conversations.Commands;

public sealed class CreateConversationCommandHandler(
    IRequestValidator<CreateConversationCommand> validator,
    IUserRepository userRepository,
    IConversationRepository conversationRepository,
    IUnitOfWork unitOfWork)
    : ICommandHandler<CreateConversationCommand, ConversationDto>
{
    public async Task<ConversationDto> HandleAsync(CreateConversationCommand command, CancellationToken cancellationToken = default)
    {
        validator.ValidateAndThrow(command);

        var participantIds = command.Request.ParticipantIds.Distinct().ToList();
        var users = await userRepository.GetByIdsAsync(participantIds, cancellationToken);

        if (users.Count != participantIds.Count)
        {
            throw new InvalidOperationException("One or more participants do not exist.");
        }

        var now = DateTime.UtcNow;
        var conversation = new Conversation(Guid.NewGuid(), command.Request.Title, now);
        foreach (var participantId in participantIds)
        {
            conversation.AddParticipant(participantId, now);
        }

        await conversationRepository.AddAsync(conversation, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var reloaded = await conversationRepository.GetByIdWithParticipantsAsync(conversation.Id, cancellationToken);
        return (reloaded ?? conversation).ToDto();
    }
}
