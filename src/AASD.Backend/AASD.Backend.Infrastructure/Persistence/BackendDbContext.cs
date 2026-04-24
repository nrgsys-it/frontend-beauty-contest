using AASD.Backend.Application.Abstractions.Persistence;
using AASD.Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AASD.Backend.Infrastructure.Persistence;

public sealed class BackendDbContext(DbContextOptions<BackendDbContext> options) : DbContext(options), IReadDbContext
{
    public DbSet<User> Users => Set<User>();

    public DbSet<Conversation> Conversations => Set<Conversation>();

    public DbSet<ConversationParticipant> ConversationParticipants => Set<ConversationParticipant>();

    public DbSet<Message> Messages => Set<Message>();

    // IReadDbContext explicit implementations — DbSet<T> implements IQueryable<T>,
    // but C# property covariance requires explicit mapping when types differ in declaration.
    IQueryable<User> IReadDbContext.Users => Users;
    IQueryable<Conversation> IReadDbContext.Conversations => Conversations;
    IQueryable<ConversationParticipant> IReadDbContext.ConversationParticipants => ConversationParticipants;
    IQueryable<Message> IReadDbContext.Messages => Messages;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BackendDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
