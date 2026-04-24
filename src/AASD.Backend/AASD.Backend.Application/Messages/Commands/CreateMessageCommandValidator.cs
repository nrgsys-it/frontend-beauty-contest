using AASD.Backend.Application.Abstractions.Validation;
using AASD.Backend.Application.Exceptions;

namespace AASD.Backend.Application.Messages.Commands;

public sealed class CreateMessageCommandValidator : IRequestValidator<CreateMessageCommand>
{
    public void ValidateAndThrow(CreateMessageCommand request)
    {
        var errors = new List<string>();

        if (request.ConversationId == Guid.Empty)
        {
            errors.Add("ConversationId is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Request.Content))
        {
            errors.Add("Content is required.");
        }

        if (request.Request.SenderId == Guid.Empty)
        {
            errors.Add("SenderId is required.");
        }

        if (errors.Count > 0)
        {
            throw new RequestValidationException(errors);
        }
    }
}
