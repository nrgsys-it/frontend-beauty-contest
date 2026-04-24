using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Abstractions.Persistence;
using AASD.Backend.Application.Contracts.Users;
using AASD.Backend.Application.Mappings;

namespace AASD.Backend.Application.Users.Queries;

public sealed class GetUsersQueryHandler(IUserRepository userRepository)
    : IQueryHandler<GetUsersQuery, IReadOnlyList<UserDto>>
{
    public async Task<IReadOnlyList<UserDto>> HandleAsync(GetUsersQuery query, CancellationToken cancellationToken = default)
    {
        var users = await userRepository.ListAsync(cancellationToken);
        return users.Select(user => user.ToDto()).ToList();
    }
}
