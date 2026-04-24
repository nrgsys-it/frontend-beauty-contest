using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Contracts.Users;
using AASD.Backend.Application.Users.Commands;
using AASD.Backend.Application.Users.Queries;
using Microsoft.AspNetCore.Mvc;

namespace AASD.Backend.API.Controllers;

[ApiController]
[Route("api/users")]
public sealed class UsersController(ICommandDispatcher commandDispatcher, IQueryDispatcher queryDispatcher) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<UserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<UserDto>>> GetUsers(CancellationToken cancellationToken)
    {
        var users = await queryDispatcher.QueryAsync<GetUsersQuery, IReadOnlyList<UserDto>>(new GetUsersQuery(), cancellationToken);
        return Ok(users);
    }

    [HttpPost]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        var createdUser = await commandDispatcher.DispatchAsync<CreateUserCommand, UserDto>(new CreateUserCommand(request), cancellationToken);
        return StatusCode(StatusCodes.Status201Created, createdUser);
    }
}
