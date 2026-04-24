using AASD.Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AASD.Backend.Infrastructure.Persistence.Seed;

public static class BackendDbSeeder
{
    public static async Task SeedAsync(BackendDbContext dbContext, CancellationToken cancellationToken = default)
    {
        if (await dbContext.Users.AnyAsync(cancellationToken))
        {
            return;
        }

        var now = DateTime.UtcNow;
        var user1 = new User(Guid.NewGuid(), "Ada", "Lovelace", "ada@example.com", "SEED_HASH_ADA", now.AddMinutes(-10));
        var user2 = new User(Guid.NewGuid(), "Alan", "Turing", "alan@example.com", "SEED_HASH_ALAN", now.AddMinutes(-9));
        var user3 = new User(Guid.NewGuid(), "Grace", "Hopper", "grace@example.com", "SEED_HASH_GRACE", now.AddMinutes(-8));

        var conversation = new Conversation(Guid.NewGuid(), "General", now.AddMinutes(-7));
        conversation.AddParticipant(user1.Id, now.AddMinutes(-7));
        conversation.AddParticipant(user2.Id, now.AddMinutes(-7));
        conversation.AddParticipant(user3.Id, now.AddMinutes(-7));

        var message1 = new Message(Guid.NewGuid(), conversation.Id, user1.Id, "Welcome to the shared backend.", 1, now.AddMinutes(-6));
        var message2 = new Message(Guid.NewGuid(), conversation.Id, user2.Id, "Persistence is centralized now.", 2, now.AddMinutes(-5));

        await dbContext.Users.AddRangeAsync(new[] { user1, user2, user3 }, cancellationToken);
        await dbContext.Conversations.AddAsync(conversation, cancellationToken);
        await dbContext.Messages.AddRangeAsync(new[] { message1, message2 }, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
