using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Contracts.Users;

namespace AASD.Backend.Application.Users.Queries;

public sealed record GetUsersQuery : IQuery<IReadOnlyList<UserDto>>;
