using AASD.Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AASD.Backend.Infrastructure.Persistence.Configurations;

public sealed class ConversationConfiguration : IEntityTypeConfiguration<Conversation>
{
    public void Configure(EntityTypeBuilder<Conversation> builder)
    {
        builder.ToTable("conversations");

        builder.HasKey(conversation => conversation.Id);
        builder.Property(conversation => conversation.Id).HasColumnName("id");

        builder.Property(conversation => conversation.Title)
            .HasColumnName("title")
            .HasMaxLength(140)
            .IsRequired();

        builder.Property(conversation => conversation.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(conversation => conversation.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();
    }
}
