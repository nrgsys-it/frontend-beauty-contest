namespace AASD.Backend.Application.Abstractions.Validation;

public interface IRequestValidator<in TRequest>
{
    void ValidateAndThrow(TRequest request);
}
