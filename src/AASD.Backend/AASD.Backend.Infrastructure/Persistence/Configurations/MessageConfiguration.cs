using AASD.Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AASD.Backend.Infrastructure.Persistence.Configurations;

public sealed class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.ToTable("messages");

        builder.HasKey(message => message.Id);
        builder.Property(message => message.Id).HasColumnName("id");

        builder.Property(message => message.Content)
            .HasColumnName("content")
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(message => message.SenderId)
            .HasColumnName("sender_id")
            .IsRequired();

        builder.Property(message => message.ConversationId)
            .HasColumnName("conversation_id")
            .IsRequired();

        builder.Property(message => message.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(message => message.MessageSequence)
            .HasColumnName("message_sequence")
            .IsRequired();

        builder.HasIndex(message => new { message.ConversationId, message.MessageSequence }).IsUnique();

        builder.HasOne(message => message.Conversation)
            .WithMany(conversation => conversation.Messages)
            .HasForeignKey(message => message.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(message => message.Sender)
            .WithMany(user => user.Messages)
            .HasForeignKey(message => message.SenderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
