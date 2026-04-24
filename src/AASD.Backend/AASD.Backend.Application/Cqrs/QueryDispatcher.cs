using AASD.Backend.Application.Abstractions.Cqrs;
using Microsoft.Extensions.DependencyInjection;

namespace AASD.Backend.Application.Cqrs;

public sealed class QueryDispatcher(IServiceProvider serviceProvider) : IQueryDispatcher
{
    public Task<TResponse> QueryAsync<TQuery, TResponse>(TQuery query, CancellationToken cancellationToken = default)
        where TQuery : IQuery<TResponse>
    {
        var handler = serviceProvider.GetRequiredService<IQueryHandler<TQuery, TResponse>>();
        return handler.HandleAsync(query, cancellationToken);
    }
}
