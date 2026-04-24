using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace AASD.Backend.Infrastructure.Persistence;

public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<BackendDbContext>
{
    public BackendDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__BackendDatabase")
            ?? "Host=localhost;Port=5432;Database=aasd_backend;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<BackendDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new BackendDbContext(optionsBuilder.Options);
    }
}
