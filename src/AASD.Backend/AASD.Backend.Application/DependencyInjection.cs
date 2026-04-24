using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Abstractions.Validation;
using AASD.Backend.Application.Conversations.Commands;
using AASD.Backend.Application.Conversations.Queries;
using AASD.Backend.Application.Contracts.Conversations;
using AASD.Backend.Application.Contracts.Messages;
using AASD.Backend.Application.Contracts.Users;
using AASD.Backend.Application.Cqrs;
using AASD.Backend.Application.Messages.Commands;
using AASD.Backend.Application.Messages.Queries;
using AASD.Backend.Application.Users.Commands;
using AASD.Backend.Application.Users.Queries;
using Microsoft.Extensions.DependencyInjection;

namespace AASD.Backend.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ICommandDispatcher, CommandDispatcher>();
        services.AddScoped<IQueryDispatcher, QueryDispatcher>();

        services.AddScoped<IRequestValidator<CreateUserCommand>, CreateUserCommandValidator>();
        services.AddScoped<IRequestValidator<CreateConversationCommand>, CreateConversationCommandValidator>();
        services.AddScoped<IRequestValidator<CreateMessageCommand>, CreateMessageCommandValidator>();

        services.AddScoped<ICommandHandler<CreateUserCommand, UserDto>, CreateUserCommandHandler>();
        services.AddScoped<IQueryHandler<GetUsersQuery, IReadOnlyList<UserDto>>, GetUsersQueryHandler>();

        services.AddScoped<ICommandHandler<CreateConversationCommand, ConversationDto>, CreateConversationCommandHandler>();
        services.AddScoped<IQueryHandler<GetConversationsQuery, IReadOnlyList<ConversationDto>>, GetConversationsQueryHandler>();

        services.AddScoped<ICommandHandler<CreateMessageCommand, MessageDto>, CreateMessageCommandHandler>();
        services.AddScoped<IQueryHandler<GetConversationMessagesQuery, IReadOnlyList<MessageDto>>, GetConversationMessagesQueryHandler>();

        return services;
    }
}
