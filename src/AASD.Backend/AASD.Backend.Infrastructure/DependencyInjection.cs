using AASD.Backend.Application.Abstractions.Persistence;
using AASD.Backend.Application.Abstractions.Security;
using AASD.Backend.Infrastructure.Persistence;
using AASD.Backend.Infrastructure.Persistence.Repositories;
using AASD.Backend.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AASD.Backend.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("BackendDatabase")
            ?? throw new InvalidOperationException("Connection string 'BackendDatabase' is not configured.");

        services.AddDbContext<BackendDbContext>(options => options.UseNpgsql(connectionString));

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IConversationRepository, ConversationRepository>();
        services.AddScoped<IMessageRepository, MessageRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IPasswordHashService, PlaceholderPasswordHashService>();

        return services;
    }
}
