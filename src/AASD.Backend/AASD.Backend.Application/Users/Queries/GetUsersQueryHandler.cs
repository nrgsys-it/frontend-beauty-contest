using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Abstractions.Persistence;
using AASD.Backend.Application.Contracts.Users;
using Microsoft.EntityFrameworkCore;

namespace AASD.Backend.Application.Users.Queries;

public sealed class GetUsersQueryHandler(IReadDbContext readDb)
    : IQueryHandler<GetUsersQuery, IReadOnlyList<UserDto>>
{
    public async Task<IReadOnlyList<UserDto>> HandleAsync(GetUsersQuery query, CancellationToken cancellationToken = default)
    {
        return await readDb.Users
            .AsNoTracking()
            .Select(u => new UserDto(u.Id, u.Name, u.Surname, u.Email, u.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}
