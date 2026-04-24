using AASD.Backend.Application.Abstractions.Cqrs;
using Microsoft.Extensions.DependencyInjection;

namespace AASD.Backend.Application.Cqrs;

public sealed class CommandDispatcher(IServiceProvider serviceProvider) : ICommandDispatcher
{
    public Task<TResponse> DispatchAsync<TCommand, TResponse>(TCommand command, CancellationToken cancellationToken = default)
        where TCommand : ICommand<TResponse>
    {
        var handler = serviceProvider.GetRequiredService<ICommandHandler<TCommand, TResponse>>();
        return handler.HandleAsync(command, cancellationToken);
    }
}
