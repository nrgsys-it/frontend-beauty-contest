using AASD.Backend.Application.Abstractions.Persistence;
using AASD.Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AASD.Backend.Infrastructure.Persistence.Repositories;

public sealed class UserRepository(BackendDbContext dbContext) : IUserRepository
{
    public async Task<IReadOnlyList<User>> ListAsync(CancellationToken cancellationToken = default)
        => await dbContext.Users
            .AsNoTracking()
            .OrderBy(user => user.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<User>> GetByIdsAsync(IReadOnlyCollection<Guid> userIds, CancellationToken cancellationToken = default)
        => await dbContext.Users
            .Where(user => userIds.Contains(user.Id))
            .ToListAsync(cancellationToken);

    public Task<User?> GetByIdAsync(Guid userId, CancellationToken cancellationToken = default)
        => dbContext.Users.FirstOrDefaultAsync(user => user.Id == userId, cancellationToken);

    public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
        => dbContext.Users.AnyAsync(user => user.Email == email, cancellationToken);

    public Task AddAsync(User user, CancellationToken cancellationToken = default)
        => dbContext.Users.AddAsync(user, cancellationToken).AsTask();
}
