using AASD.Backend.Application.Abstractions.Validation;
using AASD.Backend.Application.Exceptions;

namespace AASD.Backend.Application.Conversations.Commands;

public sealed class CreateConversationCommandValidator : IRequestValidator<CreateConversationCommand>
{
    public void ValidateAndThrow(CreateConversationCommand request)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(request.Request.Title))
        {
            errors.Add("Title is required.");
        }

        if (request.Request.ParticipantIds is null || request.Request.ParticipantIds.Count == 0)
        {
            errors.Add("At least one participant is required.");
        }

        if (request.Request.ParticipantIds?.Any(id => id == Guid.Empty) == true)
        {
            errors.Add("Participant ids must be valid GUIDs.");
        }

        if (errors.Count > 0)
        {
            throw new RequestValidationException(errors);
        }
    }
}
