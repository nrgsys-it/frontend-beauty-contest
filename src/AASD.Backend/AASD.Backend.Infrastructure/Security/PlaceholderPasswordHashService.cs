using AASD.Backend.Application.Abstractions.Security;
using System.Security.Cryptography;
using System.Text;

namespace AASD.Backend.Infrastructure.Security;

public sealed class PlaceholderPasswordHashService : IPasswordHashService
{
    public string CreatePlaceholderHash(string email)
    {
        var raw = $"{email.ToLowerInvariant()}::aasd-backend::placeholder";
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(bytes);
    }
}
