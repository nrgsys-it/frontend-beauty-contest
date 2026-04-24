namespace AASD.Backend.Application.Contracts.Users;

public sealed record UserDto(Guid Id, string Name, string Surname, string Email, DateTime CreatedAt);
