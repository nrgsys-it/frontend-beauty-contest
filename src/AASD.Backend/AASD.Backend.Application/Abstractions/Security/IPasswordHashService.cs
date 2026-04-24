namespace AASD.Backend.Application.Abstractions.Security;

public interface IPasswordHashService
{
    string CreatePlaceholderHash(string email);
}
