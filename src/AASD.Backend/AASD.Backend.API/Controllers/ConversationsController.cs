using AASD.Backend.Application.Abstractions.Cqrs;
using AASD.Backend.Application.Contracts.Conversations;
using AASD.Backend.Application.Contracts.Messages;
using AASD.Backend.Application.Conversations.Commands;
using AASD.Backend.Application.Conversations.Queries;
using AASD.Backend.Application.Messages.Commands;
using AASD.Backend.Application.Messages.Queries;
using AASD.Backend.API.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace AASD.Backend.API.Controllers;

[ApiController]
[Route("api/conversations")]
public sealed class ConversationsController(
    ICommandDispatcher commandDispatcher,
    IQueryDispatcher queryDispatcher,
    IHubContext<ChatHub> hubContext) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ConversationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ConversationDto>>> GetConversations(CancellationToken cancellationToken)
    {
        var conversations = await queryDispatcher.QueryAsync<GetConversationsQuery, IReadOnlyList<ConversationDto>>(
            new GetConversationsQuery(),
            cancellationToken);

        return Ok(conversations);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ConversationDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<ConversationDto>> CreateConversation(
        [FromBody] CreateConversationRequest request,
        CancellationToken cancellationToken)
    {
        var conversation = await commandDispatcher.DispatchAsync<CreateConversationCommand, ConversationDto>(
            new CreateConversationCommand(request),
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, conversation);
    }

    [HttpGet("{conversationId:guid}/messages")]
    [ProducesResponseType(typeof(IReadOnlyList<MessageDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<MessageDto>>> GetConversationMessages(
        Guid conversationId,
        CancellationToken cancellationToken)
    {
        var messages = await queryDispatcher.QueryAsync<GetConversationMessagesQuery, IReadOnlyList<MessageDto>>(
            new GetConversationMessagesQuery(conversationId),
            cancellationToken);

        return Ok(messages);
    }

    [HttpPost("{conversationId:guid}/messages")]
    [ProducesResponseType(typeof(MessageDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<MessageDto>> CreateMessage(
        Guid conversationId,
        [FromBody] CreateMessageRequest request,
        CancellationToken cancellationToken)
    {
        var message = await commandDispatcher.DispatchAsync<CreateMessageCommand, MessageDto>(
            new CreateMessageCommand(conversationId, request),
            cancellationToken);

        await hubContext.Clients
            .Group(ChatHub.ConversationGroup(conversationId))
            .SendAsync("ReceiveMessage", message, cancellationToken);

        return StatusCode(StatusCodes.Status201Created, message);
    }
}
