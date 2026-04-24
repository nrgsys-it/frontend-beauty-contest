# AGENTS.md — AASD.Orchestration

> Agent guide for the .NET Aspire AppHost. Read this before editing `AppHost.cs` or any Aspire configuration.

---

## What This Project Does

`AASD.Orchestration` is the .NET Aspire AppHost. It is the **single entry point** that starts and wires all services together:

```bash
dotnet run --project src/AASD.Orchestration
```

Aspire brings up the following resources in dependency order:

| Resource | Type | Port | Wait condition |
|---|---|---|---|
| `aasd` | PostgreSQL container | 51214 (host) | — |
| `data` | PostgreSQL database (inside `aasd`) | — | waits for `aasd` |
| `backend` | `AASD.Backend.API` (.NET project) | Aspire-assigned | waits for `data` |
| `angular` | npm app (`start`) | Aspire-assigned via `PORT` | waits for `backend` |
| `nextjs` | npm app (`start:aspire`) | **3001 (fixed)** | waits for `backend` |

pgAdmin is also attached to the PostgreSQL container via `.WithPgAdmin()`.

---

## `AppHost.cs` Breakdown

```csharp
// 1. PostgreSQL — persistent container, fixed host port, data volume
var postgres = builder.AddPostgres("aasd")
    .WithHostPort(51214)
    .WithDataVolume()
    .WithLifetime(ContainerLifetime.Persistent)
    .WithPgAdmin();

// 2. Database reference — connection string name used by EF Core ("BackendDatabase")
var postgresdb = postgres.AddDatabase("data");

// 3. Backend .NET project — receives connection string, waits for DB to be healthy
var backend = builder.AddProject<Projects.AASD_Backend_API>("backend")
    .WithReference(postgresdb, "BackendDatabase")
    .WaitFor(postgresdb);

// 4. Angular SSR — Aspire assigns PORT dynamically
builder.AddNpmApp("angular", "../AASD.Angular", "start")
    .WithEnvironment("BACKEND_API_URL", backend.GetEndpoint("http"))
    .WaitFor(backend)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

// 5. Next.js — PORT is FIXED at 3001
builder.AddNpmApp("nextjs", "../AASD.NextJS", "start:aspire")
    .WithEnvironment("BACKEND_API_URL", backend.GetEndpoint("http"))
    .WithEnvironment("NEXT_PUBLIC_BACKEND_API_URL", backend.GetEndpoint("http"))
    .WaitFor(backend)
    .WithHttpEndpoint(port: 3001, env: "PORT")
    .WithExternalHttpEndpoints();
```

---

## Critical Rules

### 1. Next.js Port is Fixed at 3001

```csharp
.WithHttpEndpoint(port: 3001, env: "PORT")
```

This is a hard constraint. The `start:aspire` npm script in `AASD.NextJS/package.json` passes `-p 3001`. **Do not change this port** in `AppHost.cs`, `next.config.ts`, or any npm script.

### 2. Resource Names Are Stable — Do Not Rename

| Resource name | Used by |
|---|---|
| `"aasd"` | PostgreSQL container; connection string base name |
| `"backend"` | `.WithReference()` anchor; referenced in docs |
| `"angular"` | Aspire Dashboard, `BACKEND_API_URL` injection |
| `"nextjs"` | Aspire Dashboard, both `BACKEND_API_URL` env vars |

Renaming any resource breaks service discovery, environment injection, and documentation.

### 3. npm Script Names Must Match `package.json`

| App | Script in `AppHost.cs` | Must exist in `package.json` |
|---|---|---|
| Angular | `"start"` | `"start"` (maps to `start:ssr`) |
| Next.js | `"start:aspire"` | `"start:aspire"` |

If a script is renamed in `package.json`, update `AppHost.cs` to match — and vice versa.

### 4. `NEXT_PUBLIC_BACKEND_API_URL` Must Be Wired Here

Next.js `NEXT_PUBLIC_*` variables are baked into the client bundle at build time **or** injected at server start. Aspire injects `NEXT_PUBLIC_BACKEND_API_URL` at startup via `.WithEnvironment(...)`. If you add a new public env var that references a backend endpoint, add it here in `AppHost.cs` — not in `.env.local` for production.

### 5. `BACKEND_API_URL` vs `NEXT_PUBLIC_BACKEND_API_URL`

Both are injected into Next.js:

- `BACKEND_API_URL` — used by server-side code (API routes, SSR fetch).
- `NEXT_PUBLIC_BACKEND_API_URL` — available in browser-side code (SignalR hub URL, client fetch).

Angular only receives `BACKEND_API_URL` (it has no `NEXT_PUBLIC_*` convention).

### 6. Never Add CORS or Auth Logic Here

`AppHost.cs` is **infrastructure wiring only**. CORS policy lives in `AASD.Backend.API/Program.cs`. Auth configuration lives in the backend and frontend projects. Do not add any of that here.

---

## Environment Variable Injection Reference

All env vars are resolved at Aspire startup from live resource endpoints. They are **not** hardcoded strings.

| Variable | Injected into | Value |
|---|---|---|
| `PORT` | Angular | Aspire-assigned HTTP port |
| `BACKEND_API_URL` | Angular | Backend HTTP endpoint |
| `PORT` | Next.js | `3001` (fixed) |
| `BACKEND_API_URL` | Next.js | Backend HTTP endpoint |
| `NEXT_PUBLIC_BACKEND_API_URL` | Next.js | Backend HTTP endpoint |
| `BackendDatabase` (conn string) | Backend API | PostgreSQL `data` database connection string |

---

## Adding a New Service

### New .NET Project

```csharp
var myService = builder.AddProject<Projects.AASD_MyService>("my-service")
    .WithReference(postgresdb, "BackendDatabase") // if it needs the DB
    .WaitFor(postgresdb);
```

Then register `AASD.MyService.csproj` in `AASD.sln` and add a `<ProjectReference>` to `AASD.Orchestration.csproj`.

### New npm App

```csharp
builder.AddNpmApp("my-app", "../AASD.MyApp", "start:aspire")
    .WithEnvironment("BACKEND_API_URL", backend.GetEndpoint("http"))
    .WaitFor(backend)
    .WithHttpEndpoint(env: "PORT")   // let Aspire assign the port
    .WithExternalHttpEndpoints();
```

- **Do not hardcode a port** unless there is a hard external constraint (like Next.js/3001).
- The npm script name (`"start:aspire"`) must exist in the app's `package.json`.
- The relative path (`"../AASD.MyApp"`) is relative to `AASD.Orchestration/`.

---

## Aspire Dashboard

The Aspire Dashboard starts automatically when you run the AppHost. The HTTPS URL is printed to the console on startup (format: `https://localhost:17XXX`). It shows:

- Live status of all resources (Running / Starting / Failed)
- stdout/stderr logs per resource
- Distributed traces (if OTLP is configured)
- Environment variables injected into each resource

Use the Dashboard as the **first stop** when diagnosing startup failures.

---

## Debugging Startup Failures

### Step 1 — Check the Dashboard logs

Open the Dashboard URL from the console output. Click the failing resource and inspect its log stream. Most failures (missing npm script, port conflict, DB not ready) are visible here.

### Step 2 — PostgreSQL not healthy

If `backend` or the npm apps fail with a connection error, check whether the `aasd` container is running:

```bash
docker ps --filter "name=aasd"
```

The container uses a persistent data volume. If the volume is corrupt, remove it:

```bash
docker volume ls   # find the volume name
docker volume rm <volume-name>
```

### Step 3 — Port 3001 conflict

If Next.js fails immediately, check for a stale process on port 3001:

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <pid> /F
```

### Step 4 — npm script not found

If an npm app resource shows `npm ERR! missing script`, the script name in `AppHost.cs` does not match `package.json`. Verify:

```bash
# Angular
cat src/AASD.Angular/package.json | grep '"start"'

# Next.js
cat src/AASD.NextJS/package.json | grep '"start:aspire"'
```

### Step 5 — `NEXT_PUBLIC_BACKEND_API_URL` is empty in the browser

This variable is only injected by Aspire at startup. Running `npm run dev` directly without Aspire means the variable is not set. Create `src/AASD.NextJS/.env.local`:

```
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5208
```

Do **not** commit `.env.local`.

---

## Package References

| Package | Version | Purpose |
|---|---|---|
| `Aspire.AppHost.Sdk` | 13.2.2 | AppHost SDK (Sdk attribute on `.csproj`) |
| `Aspire.Hosting.JavaScript` | 13.2.3 | `AddNpmApp` support |
| `Aspire.Hosting.NodeJs` | 9.5.2 | Node.js process hosting |
| `Aspire.Hosting.PostgreSQL` | 13.2.3 | PostgreSQL container + pgAdmin |

---

## Files in This Project

| File | Purpose |
|---|---|
| `AppHost.cs` | The entire orchestration definition — all resources, references, and env injection |
| `AASD.Orchestration.csproj` | SDK, target framework, package and project references |
| `AGENTS.md` | This file |

There is intentionally no application logic here — only Aspire wiring.
