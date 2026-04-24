using AASD.Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AASD.Backend.Infrastructure.Persistence.Configurations;

public sealed class ConversationParticipantConfiguration : IEntityTypeConfiguration<ConversationParticipant>
{
    public void Configure(EntityTypeBuilder<ConversationParticipant> builder)
    {
        builder.ToTable("conversation_participants");

        builder.HasKey(participant => new { participant.ConversationId, participant.UserId });

        builder.Property(participant => participant.ConversationId).HasColumnName("conversation_id");
        builder.Property(participant => participant.UserId).HasColumnName("user_id");
        builder.Property(participant => participant.JoinedAt).HasColumnName("joined_at").IsRequired();

        builder.HasOne(participant => participant.Conversation)
            .WithMany(conversation => conversation.Participants)
            .HasForeignKey(participant => participant.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(participant => participant.User)
            .WithMany(user => user.ConversationParticipants)
            .HasForeignKey(participant => participant.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(participant => participant.UserId);
    }
}
