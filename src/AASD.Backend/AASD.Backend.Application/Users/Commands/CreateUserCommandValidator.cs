using AASD.Backend.Application.Abstractions.Validation;
using AASD.Backend.Application.Exceptions;

namespace AASD.Backend.Application.Users.Commands;

public sealed class CreateUserCommandValidator : IRequestValidator<CreateUserCommand>
{
    public void ValidateAndThrow(CreateUserCommand request)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(request.Request.Name))
        {
            errors.Add("Name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Request.Surname))
        {
            errors.Add("Surname is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Request.Email))
        {
            errors.Add("Email is required.");
        }
        else if (!request.Request.Email.Contains('@'))
        {
            errors.Add("Email must be valid.");
        }

        if (errors.Count > 0)
        {
            throw new RequestValidationException(errors);
        }
    }
}
