using AASD.Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AASD.Backend.Infrastructure.Persistence;

public sealed class BackendDbContext(DbContextOptions<BackendDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<Conversation> Conversations => Set<Conversation>();

    public DbSet<ConversationParticipant> ConversationParticipants => Set<ConversationParticipant>();

    public DbSet<Message> Messages => Set<Message>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BackendDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
