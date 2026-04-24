using AASD.Backend.Domain.Entities;

namespace AASD.Backend.Application.Abstractions.Persistence;

public interface IUserRepository
{
    Task<IReadOnlyList<User>> ListAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<User>> GetByIdsAsync(IReadOnlyCollection<Guid> userIds, CancellationToken cancellationToken = default);

    Task<User?> GetByIdAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);

    Task AddAsync(User user, CancellationToken cancellationToken = default);
}
