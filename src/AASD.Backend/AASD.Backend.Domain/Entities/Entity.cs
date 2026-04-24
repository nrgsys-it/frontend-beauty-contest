namespace AASD.Backend.Domain.Entities;

public abstract class Entity
{
    protected static T Require<T>(T? value, string name) where T : class
        => value ?? throw new ArgumentNullException(name);

    protected static string Require(string? value, string name)
        => string.IsNullOrWhiteSpace(value)
            ? throw new ArgumentException($"{name} cannot be null or whitespace.", name)
            : value.Trim();
}
