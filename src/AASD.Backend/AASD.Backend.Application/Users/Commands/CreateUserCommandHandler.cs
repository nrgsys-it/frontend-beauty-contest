using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Abstractions.Persistence;
using AASD.Backend.Application.Abstractions.Security;
using AASD.Backend.Application.Abstractions.Validation;
using AASD.Backend.Application.Contracts.Users;
using AASD.Backend.Application.Mappings;
using AASD.Backend.Domain.Entities;

namespace AASD.Backend.Application.Users.Commands;

public sealed class CreateUserCommandHandler(
    IRequestValidator<CreateUserCommand> validator,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IPasswordHashService passwordHashService)
    : ICommandHandler<CreateUserCommand, UserDto>
{
    public async Task<UserDto> HandleAsync(CreateUserCommand command, CancellationToken cancellationToken = default)
    {
        validator.ValidateAndThrow(command);

        var email = command.Request.Email.Trim().ToLowerInvariant();
        if (await userRepository.EmailExistsAsync(email, cancellationToken))
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }

        var createdAt = DateTime.UtcNow;
        var user = new User(
            Guid.NewGuid(),
            command.Request.Name,
            command.Request.Surname,
            email,
            passwordHashService.CreatePlaceholderHash(email),
            createdAt);

        await userRepository.AddAsync(user, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return user.ToDto();
    }
}
