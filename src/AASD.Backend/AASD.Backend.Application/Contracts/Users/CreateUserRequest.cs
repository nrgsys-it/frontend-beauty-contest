namespace AASD.Backend.Application.Contracts.Users;

public sealed record CreateUserRequest(string Name, string Surname, string Email);
