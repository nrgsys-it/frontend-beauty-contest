using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Contracts.Users;

namespace AASD.Backend.Application.Users.Commands;

public sealed record CreateUserCommand(CreateUserRequest Request) : ICommand<UserDto>;
