using AASD.Backend.Application.Abstractions.Persistence;

namespace AASD.Backend.Infrastructure.Persistence;

public sealed class UnitOfWork(BackendDbContext dbContext) : IUnitOfWork
{
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => dbContext.SaveChangesAsync(cancellationToken);
}
