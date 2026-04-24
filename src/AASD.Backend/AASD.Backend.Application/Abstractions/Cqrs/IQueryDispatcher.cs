namespace AASD.Backend.Application.Abstractions.Cqrs;

public interface IQueryDispatcher
{
    Task<TResponse> QueryAsync<TQuery, TResponse>(TQuery query, CancellationToken cancellationToken = default)
        where TQuery : IQuery<TResponse>;
}
