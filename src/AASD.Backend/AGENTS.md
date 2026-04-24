# AGENTS.md — AASD.Backend

> Authoritative guide for AI coding agents working on the .NET 9 backend.
> Read this file **in full** before touching any `.cs` file in `src/AASD.Backend/`.

---

## Project Layout

```
src/AASD.Backend/
├── AASD.Backend.Domain/
│   └── Entities/                   # Sealed domain entities — no infrastructure deps
│       ├── User.cs
│       ├── Conversation.cs
│       ├── ConversationParticipant.cs
│       └── Message.cs
│
├── AASD.Backend.Application/
│   ├── Abstractions/
│   │   ├── Cqrs/                   # ICommand, IQuery, ICommandHandler, IQueryHandler,
│   │   │                           #   ICommandDispatcher, IQueryDispatcher
│   │   ├── Persistence/            # IUserRepository, IConversationRepository,
│   │   │                           #   IMessageRepository, IUnitOfWork
│   │   ├── Security/               # IPasswordHashService
│   │   └── Validation/             # IRequestValidator<T>
│   ├── Contracts/                  # Request DTOs + response DTOs
│   │   ├── Users/
│   │   ├── Conversations/
│   │   └── Messages/
│   ├── Cqrs/                       # CommandDispatcher, QueryDispatcher (concrete)
│   ├── Exceptions/                 # RequestValidationException
│   ├── Mappings/                   # ContractMappings (extension methods)
│   ├── Users/
│   │   ├── Commands/               # CreateUserCommand + Handler + Validator
│   │   └── Queries/                # GetUsersQuery + Handler
│   ├── Conversations/
│   │   ├── Commands/               # CreateConversationCommand + Handler + Validator
│   │   └── Queries/                # GetConversationsQuery + Handler
│   ├── Messages/
│   │   ├── Commands/               # CreateMessageCommand + Handler + Validator
│   │   └── Queries/                # GetConversationMessagesQuery + Handler
│   └── DependencyInjection.cs      # AddApplication() — registers all handlers + dispatchers
│
├── AASD.Backend.Infrastructure/
│   ├── Persistence/
│   │   ├── BackendDbContext.cs
│   │   ├── UnitOfWork.cs
│   │   ├── Configurations/         # EF Core IEntityTypeConfiguration per entity
│   │   ├── Repositories/           # UserRepository, ConversationRepository, MessageRepository
│   │   ├── Seed/                   # BackendDbSeeder (runs at startup when Seed:Enabled=true)
│   │   ├── DesignTimeDbContextFactory.cs
│   │   └── Migrations/             # EF Core migration history — source of truth for DB schema
│   ├── Security/                   # PlaceholderPasswordHashService
│   └── DependencyInjection.cs      # AddInfrastructure() — registers DbContext, repos, UoW
│
└── AASD.Backend.API/
    ├── Controllers/
    │   ├── UsersController.cs      # GET /api/users, POST /api/users
    │   └── ConversationsController.cs  # GET/POST /api/conversations,
    │                               #   GET/POST /api/conversations/{id}/messages
    ├── Hubs/
    │   └── ChatHub.cs              # SignalR hub at /chat-hub
    └── Program.cs                  # Startup, middleware pipeline
```

---

## Layer Dependency Rules

```
Domain  ←  Application  ←  Infrastructure  ←  API
```

- **Domain** has zero external dependencies. No EF Core, no Application references.
- **Application** references Domain only. No Infrastructure, no API.
- **Infrastructure** references Application (to implement its interfaces) and Domain.
- **API** references Application (dispatchers + contracts) and Infrastructure
  (`AddInfrastructure()` in `Program.cs`). The API layer **never** imports Domain types
  directly for business logic — it only passes IDs/DTOs to dispatchers.

**Violation examples — do not do these:**
- Adding `using AASD.Backend.Infrastructure` in a command handler.
- Newing up a domain entity directly inside a controller.
- Accessing `BackendDbContext` from the API layer.

---

## Domain Entities

All entities are `sealed`, have a **private parameterless constructor** (for EF Core), and
expose **private setters** on all properties. Mutation is only through the public constructor
or explicit domain methods.

### `User`

| Property | Type | Notes |
|---|---|---|
| `Id` | `Guid` | Set in constructor |
| `Name` | `string` | Trimmed, required |
| `Surname` | `string` | Trimmed, required |
| `Email` | `string` | Lowercased + trimmed in constructor |
| `PasswordHash` | `string` | Set by `IPasswordHashService` |
| `CreatedAt` | `DateTime` | UTC |

Navigation: `ConversationParticipants`, `Messages`.

### `Conversation`

| Property | Type | Notes |
|---|---|---|
| `Id` | `Guid` | |
| `Title` | `string` | Trimmed, required |
| `CreatedAt` | `DateTime` | UTC |
| `UpdatedAt` | `DateTime` | UTC — updated by domain methods |

Domain methods:
- `AddParticipant(userId, joinedAt)` — idempotent; skips if user already a participant.
- `Touch(updatedAt)` — bumps `UpdatedAt`.

Navigation: `Participants` (`ICollection<ConversationParticipant>`), `Messages`.

### `ConversationParticipant`

Composite join entity (no surrogate PK). Properties: `ConversationId`, `UserId`,
`JoinedAt`. Navigation back to `Conversation` and `User`.

### `Message`

| Property | Type | Notes |
|---|---|---|
| `Id` | `Guid` | |
| `ConversationId` | `Guid` | |
| `SenderId` | `Guid` | |
| `Content` | `string` | Trimmed, required |
| `MessageSequence` | `long` | **Ordering field** — see critical rules |
| `CreatedAt` | `DateTime` | UTC |

Navigation: `Sender` (`User?`), `Conversation` (`Conversation?`).

> **Never order messages by `CreatedAt`** — always use `MessageSequence`.

---

## CQRS Pattern

This project uses a **hand-rolled CQRS** system. There is no MediatR.

### Core Abstractions (`Application/Abstractions/Cqrs/`)

```csharp
public interface ICommand<TResponse> { }
public interface IQuery<TResponse> { }

public interface ICommandHandler<TCommand, TResponse>
    where TCommand : ICommand<TResponse>
{
    Task<TResponse> HandleAsync(TCommand command, CancellationToken ct = default);
}

public interface IQueryHandler<TQuery, TResponse>
    where TQuery : IQuery<TResponse>
{
    Task<TResponse> HandleAsync(TQuery query, CancellationToken ct = default);
}

public interface ICommandDispatcher
{
    Task<TResponse> DispatchAsync<TCommand, TResponse>(TCommand command, CancellationToken ct = default)
        where TCommand : ICommand<TResponse>;
}

public interface IQueryDispatcher
{
    Task<TResponse> QueryAsync<TQuery, TResponse>(TQuery query, CancellationToken ct = default)
        where TQuery : IQuery<TResponse>;
}
```

`CommandDispatcher` and `QueryDispatcher` resolve the concrete handler from DI via
`IServiceProvider.GetRequiredService<ICommandHandler<TCommand, TResponse>>()`.

### Handler Structure Pattern

```csharp
public sealed class CreateFooCommandHandler(
    IRequestValidator<CreateFooCommand> validator,
    IFooRepository fooRepository,
    IUnitOfWork unitOfWork)
    : ICommandHandler<CreateFooCommand, FooDto>
{
    public async Task<FooDto> HandleAsync(CreateFooCommand command, CancellationToken ct = default)
    {
        validator.ValidateAndThrow(command);   // throws RequestValidationException on failure
        // ... business logic ...
        await fooRepository.AddAsync(entity, ct);
        await unitOfWork.SaveChangesAsync(ct); // single commit point
        return entity.ToDto();
    }
}
```

### DI Registration (must keep in sync)

Every handler + validator must be registered in
`AASD.Backend.Application/DependencyInjection.cs`:

```csharp
services.AddScoped<IRequestValidator<CreateFooCommand>, CreateFooCommandValidator>();
services.AddScoped<ICommandHandler<CreateFooCommand, FooDto>, CreateFooCommandHandler>();
```

If the registration is missing, `CommandDispatcher.DispatchAsync` throws at runtime.

---

## Repository Interfaces

Repositories in `Application/Abstractions/Persistence/` define **read + add** operations
only. There are **no update or delete methods** on repositories.

### `IUserRepository`
```csharp
Task<IReadOnlyList<User>> ListAsync(CancellationToken ct);
Task<IReadOnlyList<User>> GetByIdsAsync(IReadOnlyCollection<Guid> userIds, CancellationToken ct);
Task<User?> GetByIdAsync(Guid userId, CancellationToken ct);
Task<bool> EmailExistsAsync(string email, CancellationToken ct);
Task AddAsync(User user, CancellationToken ct);
```

### `IConversationRepository`
```csharp
Task<IReadOnlyList<Conversation>> ListWithParticipantsAsync(CancellationToken ct);
Task<Conversation?> GetByIdWithParticipantsAsync(Guid conversationId, CancellationToken ct);
Task AddAsync(Conversation conversation, CancellationToken ct);
```

### `IMessageRepository`
```csharp
Task<IReadOnlyList<Message>> ListByConversationAsync(Guid conversationId, CancellationToken ct);
Task<long> GetNextMessageSequenceAsync(Guid conversationId, CancellationToken ct);  // ← critical
Task AddAsync(Message message, CancellationToken ct);
```

### `IUnitOfWork`
```csharp
Task SaveChangesAsync(CancellationToken ct);
```

Mutations tracked by EF Core are flushed **only** via `IUnitOfWork.SaveChangesAsync()`.
Do not call `DbContext.SaveChangesAsync()` directly from handlers.

---

## Validation

Validators implement `IRequestValidator<TCommand>` and call FluentValidation internally.
`ValidateAndThrow(command)` throws `RequestValidationException` (HTTP 400) on failure.

The exception middleware in `Program.cs` maps exception types to HTTP status codes:

| Exception | HTTP Status |
|---|---|
| `RequestValidationException` | 400 Bad Request |
| `KeyNotFoundException` | 404 Not Found |
| `InvalidOperationException` | 409 Conflict |
| anything else | 500 Internal Server Error |

Validation errors are surfaced in `problem.Extensions["errors"]`.

---

## DTO Mapping Rules

All mapping lives in `Application/Mappings/ContractMappings.cs` as internal extension methods.

**Golden rule:** always null-check navigation properties before mapping — throw
`InvalidOperationException` if null (fail-fast, not silently swallow):

```csharp
public static MessageDto ToDto(this Message message)
{
    if (message.Sender is null)
        throw new InvalidOperationException("Message sender must be loaded before mapping.");

    return new MessageDto(..., new MessageSenderDto(message.Sender.Id, ...));
}
```

When you need to map an entity with a navigation property, ensure the repo method
eagerly loads it (`Include()`). Check the corresponding repository implementation
before calling `.ToDto()`.

---

## SignalR

**Hub class:** `AASD.Backend.API.Hubs.ChatHub`  
**Endpoint:** `/chat-hub`  
**Group naming convention:** `conversation:{conversationId:N}` (no hyphens in the GUID)

```csharp
// Static helper — always use this to build group names
ChatHub.ConversationGroup(conversationId)  // → "conversation:b4f2e1a3c5d6..."

// Hub methods available to clients:
JoinConversation(Guid conversationId, Guid userId)   // adds connection to group
LeaveConversation(Guid conversationId)               // removes from group
```

**After persisting a message**, the controller broadcasts to the group:

```csharp
await hubContext.Clients
    .Group(ChatHub.ConversationGroup(conversationId))
    .SendAsync("ReceiveMessage", message, cancellationToken);
```

The client event name is `"ReceiveMessage"`. Do not change it without updating both
frontend clients.

---

## Controllers

### `UsersController` — `GET/POST /api/users`

| Method | Route | Action |
|---|---|---|
| GET | `/api/users` | Dispatch `GetUsersQuery` → `IReadOnlyList<UserDto>` |
| POST | `/api/users` | Dispatch `CreateUserCommand` → `UserDto` (201) |

### `ConversationsController` — `GET/POST /api/conversations`

| Method | Route | Action |
|---|---|---|
| GET | `/api/conversations` | Dispatch `GetConversationsQuery` |
| POST | `/api/conversations` | Dispatch `CreateConversationCommand` (201) |
| GET | `/api/conversations/{id}/messages` | Dispatch `GetConversationMessagesQuery` |
| POST | `/api/conversations/{id}/messages` | Dispatch `CreateMessageCommand` + SignalR broadcast (201) |

---

## How to Add a New Command

Follow this checklist in order:

1. **Contract** — add `CreateFooRequest.cs` and `FooDto.cs` under `Application/Contracts/Foos/`.
2. **Command** — add `CreateFooCommand.cs` in `Application/Foos/Commands/`:
   ```csharp
   public sealed record CreateFooCommand(CreateFooRequest Request) : ICommand<FooDto>;
   ```
3. **Validator** — add `CreateFooCommandValidator.cs` implementing `IRequestValidator<CreateFooCommand>`.
4. **Handler** — add `CreateFooCommandHandler.cs` implementing `ICommandHandler<CreateFooCommand, FooDto>`.
   - Inject repos + `IUnitOfWork` via primary constructor.
   - First line: `validator.ValidateAndThrow(command);`
   - Last persistence step: `await unitOfWork.SaveChangesAsync(ct);`
5. **Mapping** — add `ToDto(this Foo foo)` extension in `ContractMappings.cs`.
6. **DI registration** — add both lines to `Application/DependencyInjection.cs`:
   ```csharp
   services.AddScoped<IRequestValidator<CreateFooCommand>, CreateFooCommandValidator>();
   services.AddScoped<ICommandHandler<CreateFooCommand, FooDto>, CreateFooCommandHandler>();
   ```
7. **Controller** — add an action that calls `commandDispatcher.DispatchAsync<CreateFooCommand, FooDto>(...)`.

---

## How to Add a New Query

1. **Query** — add `GetFoosQuery.cs` in `Application/Foos/Queries/`:
   ```csharp
   public sealed record GetFoosQuery(...) : IQuery<IReadOnlyList<FooDto>>;
   ```
2. **Handler** — add `GetFoosQueryHandler.cs` implementing `IQueryHandler<GetFoosQuery, IReadOnlyList<FooDto>>`.
3. **DI registration**:
   ```csharp
   services.AddScoped<IQueryHandler<GetFoosQuery, IReadOnlyList<FooDto>>, GetFoosQueryHandler>();
   ```
4. **Controller** — call `queryDispatcher.QueryAsync<GetFoosQuery, IReadOnlyList<FooDto>>(...)`.

---

## How to Add a New Entity

This is a multi-layer operation. Do all steps:

1. **Domain** — create `Foo.cs` in `Domain/Entities/`. Make it `sealed`, private parameterless
   ctor, private setters, domain methods for mutation.
2. **EF Core configuration** — create `FooConfiguration.cs` in
   `Infrastructure/Persistence/Configurations/` implementing `IEntityTypeConfiguration<Foo>`.
   Register it in `BackendDbContext.OnModelCreating`.
3. **DbSet** — add `public DbSet<Foo> Foos { get; set; }` to `BackendDbContext`.
4. **Repository interface** — create `IFooRepository.cs` in `Application/Abstractions/Persistence/`.
5. **Repository implementation** — create `FooRepository.cs` in
   `Infrastructure/Persistence/Repositories/`.
6. **DI** — register in `Infrastructure/DependencyInjection.cs`:
   ```csharp
   services.AddScoped<IFooRepository, FooRepository>();
   ```
7. **Migration** — see the migration workflow below.
8. **Prisma schema coordination** — notify that the schema has changed so that both
   `AASD.Angular` and `AASD.NextJS` Prisma schemas can be updated to stay in sync.

---

## EF Core Migration Workflow

EF Core migrations are the **source of truth** for the database schema. There is exactly
one migration so far: `20260424120744_InitialCreate`.

### Check existing migrations before touching schema

```bash
# from repo root
ls src/AASD.Backend/AASD.Backend.Infrastructure/Persistence/Migrations/
```

### Create a new migration

```bash
# from AASD.Backend.Infrastructure/
dotnet ef migrations add <MigrationName> \
  --startup-project ../AASD.Backend.API/AASD.Backend.API.csproj \
  --context BackendDbContext
```

Or from solution root:

```bash
dotnet ef migrations add <MigrationName> \
  --project src/AASD.Backend/AASD.Backend.Infrastructure \
  --startup-project src/AASD.Backend/AASD.Backend.API \
  --context BackendDbContext
```

### Apply migrations

Migrations are applied **automatically at startup** when `Seed:Enabled=true` (default in
Development or when the config key is set):

```csharp
await dbContext.Database.MigrateAsync();
```

To apply manually:

```bash
dotnet ef database update \
  --project src/AASD.Backend/AASD.Backend.Infrastructure \
  --startup-project src/AASD.Backend/AASD.Backend.API
```

### Schema coordination with Prisma ⚠️

`AASD.Angular` and `AASD.NextJS` each have their own Prisma schema pointing at the same
PostgreSQL database. A schema change in EF Core **will not** auto-update those schemas.

When adding or altering tables/columns:
1. Create and verify the EF Core migration.
2. Update `AASD.Angular/prisma/schema.prisma`.
3. Update `AASD.NextJS/prisma/schema.prisma`.
4. Do **not** run `prisma migrate dev` or `prisma db push` — EF Core owns the schema.
   Run `prisma db pull` or manually sync the Prisma schema to match.

---

## Running the Backend

```bash
# Preferred — run everything via Aspire (wires connection strings automatically)
dotnet run --project src/AASD.Orchestration

# Standalone (requires BackendDatabase connection string in appsettings or env)
dotnet run --project src/AASD.Backend/AASD.Backend.API
```

### Key URLs (standalone)

| Service | URL |
|---|---|
| REST API | `http://localhost:5208` |
| Swagger UI | `http://localhost:5208/swagger` |
| SignalR Hub | `http://localhost:5208/chat-hub` |
| Health check | `http://localhost:5208/health` |

---

## Critical Constraints

### 1. Never Skip Layers

The API must not reference `AASD.Backend.Domain` or `AASD.Backend.Infrastructure` for
business logic. Controllers dispatch commands and queries — that is all they do.

### 2. Domain Entities: Private Setters, Domain Methods Only

Never set entity properties from outside the entity:

```csharp
// ❌ Wrong — bypasses domain invariants
message.Content = "edited";

// ✅ Correct — expose a domain method if mutation is needed
message.Edit("edited", editedAt);
```

### 3. CQRS: Always Register in DI

Forgetting to register a handler in `Application/DependencyInjection.cs` causes a
runtime `InvalidOperationException` from `CommandDispatcher`/`QueryDispatcher`. There is
no compile-time safety net.

### 4. UnitOfWork: Single SaveChanges per Handler

Only call `unitOfWork.SaveChangesAsync()` once per handler, at the end, after all
entity mutations are staged. Never call `DbContext.SaveChangesAsync()` directly from
application or domain code.

### 5. Message Sequence — Never Use Timestamp Ordering

```csharp
// ❌ Wrong
var next = messages.Max(m => m.CreatedAt) + TimeSpan.FromMilliseconds(1);

// ✅ Correct
var nextSequence = await messageRepository.GetNextMessageSequenceAsync(conversationId, ct);
var message = new Message(Guid.NewGuid(), conversationId, senderId, content, nextSequence, now);
```

`GetNextMessageSequenceAsync` returns `MAX(MessageSequence) + 1` scoped to the
conversation, giving a monotonic sequence safe under concurrent inserts.

### 6. DTO Mapping: Fail-Fast on Null Navigation Properties

Before calling `.ToDto()` on any entity, ensure its navigation properties are loaded.
If a navigation property is null at mapping time, throw `InvalidOperationException` —
never return a partial DTO or silently skip the field.

### 7. CORS: Do Not Add `.AllowCredentials()`

```csharp
// Program.cs — this is correct as-is
policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();

// ❌ This crashes the app — AllowAnyOrigin() + AllowCredentials() is illegal
policy.AllowAnyOrigin().AllowCredentials();
```

### 8. SignalR Broadcast After Message Persist

The controller (not the handler) is responsible for the SignalR broadcast. The handler
returns a `MessageDto`; the controller then pushes it to the group. This keeps the
Application layer free of SignalR references.

### 9. Connection String Named `BackendDatabase`

Infrastructure reads `configuration.GetConnectionString("BackendDatabase")` and throws
if missing. Aspire injects this at runtime. For local standalone runs, set it in
`appsettings.Development.json` or via environment variable
`ConnectionStrings__BackendDatabase`.

### 10. Email Uniqueness Is Enforced at Application Layer

`CreateUserCommandHandler` calls `userRepository.EmailExistsAsync(email)` and throws
`InvalidOperationException` (→ HTTP 409) if the email already exists. The EF Core
configuration also enforces a unique index on `Users.Email` as a database-level guard.
