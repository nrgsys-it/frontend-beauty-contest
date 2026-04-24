namespace AASD.Backend.Application.Abstractions.Cqrs;

public interface ICommandDispatcher
{
    Task<TResponse> DispatchAsync<TCommand, TResponse>(TCommand command, CancellationToken cancellationToken = default)
        where TCommand : ICommand<TResponse>;
}
