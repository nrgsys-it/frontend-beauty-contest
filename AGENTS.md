# AGENTS.md — AASD Frontend-Beauty-Contest

> Canonical guide for AI coding agents. Read this before touching any file in this repo.

---

## Project Overview

**AASD Frontend-Beauty-Contest** is a monorepo beauty contest comparing two modern frontend stacks — **Angular 21** and **Next.js 15** — against a shared **.NET 9** backend, orchestrated by **.NET Aspire 13.2.2**.

The goal is a like-for-like feature comparison. Both frontends implement the same product surface. The backend and database are shared.

---

## Repository Structure

```
frontend-beauty-contest/
├── .synapsys/                        # Synapsys knowledge layer (do not modify manually)
├── AGENTS.md                         # This file
├── README.md
└── src/
    ├── AASD.sln                      # Solution file — all projects registered here
    ├── AASD.Orchestration/           # .NET Aspire AppHost — starts everything
    ├── AASD.Angular/                 # Angular 21 SSR frontend
    ├── AASD.NextJS/                  # Next.js 15 frontend
    └── AASD.Backend/                 # .NET 9 Clean Architecture backend
        ├── AASD.Backend.Domain/
        ├── AASD.Backend.Application/
        ├── AASD.Backend.Infrastructure/
        └── AASD.Backend.API/
```

Each sub-project has its own `AGENTS.md` with deeper detail — always read the relevant one before editing that sub-project.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Orchestration | .NET Aspire 13.2.2 |
| Angular frontend | Angular 21, SSR (Express), Prisma 7.8, Tailwind 4, Vitest |
| Next.js frontend | Next.js 15.3.1, React 19, Prisma 6, Zustand 5, React Query 5, Framer Motion, SignalR |
| Backend | ASP.NET Core 9, EF Core 9, CQRS (custom), PostgreSQL, SignalR, Swagger |
| Database | PostgreSQL (single shared instance) |

---

## Running the Project

### Full stack via Aspire (preferred)

```bash
dotnet run --project src/AASD.Orchestration
```

Aspire starts and wires: PostgreSQL → Backend → Angular → Next.js. Environment variables (ports, connection strings, API URLs) are injected automatically.

### Individual services (debugging only)

```bash
# Next.js
cd src/AASD.NextJS && npm run dev

# Angular SSR
cd src/AASD.Angular && npm run start:ssr

# Backend API
cd src/AASD.Backend/AASD.Backend.API && dotnet run
```

---

## Key Endpoints

| Service | URL |
|---|---|
| Backend API | `http://localhost:5208` |
| Swagger UI | `http://localhost:5208/swagger` |
| SignalR Hub | `http://localhost:5208/chat-hub` |
| Next.js | `http://localhost:3001` |
| Angular SSR | `http://localhost:4000` |

---

## Critical Constraints — Read Before Changing Anything

### 1. Next.js Port is Fixed at 3001

Aspire injects `PORT=3001` at runtime. The `start:aspire` npm script passes `-p 3001` explicitly. **Do not change this port** in any config, script, or Aspire resource definition.

### 2. CORS — No `AllowCredentials()`

The backend CORS policy uses `AllowAnyOrigin()`. This is intentional and **incompatible** with `AllowCredentials()`. Do **not** add `.AllowCredentials()` — it will crash the backend at startup.

### 3. SignalR — Use `@microsoft/signalr`, Not Native WebSocket

- Always use the `@microsoft/signalr` npm package.
- Connection negotiation happens via HTTP POST (SignalR protocol) — do not bypass it.
- Set `withCredentials: false` on the `HubConnectionBuilder`.
- **Hub URL:** derive at runtime from `NEXT_PUBLIC_BACKEND_API_URL`:
  ```ts
  const hubUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/chat-hub`;
  ```

### 4. `NEXT_PUBLIC_WS_URL` is an Orphan Variable — Do Not Use It

This env var exists but is **not** the SignalR hub URL. Do not use it as a hub endpoint. Always derive the hub URL from `NEXT_PUBLIC_BACKEND_API_URL` (see above).

### 5. `NEXT_PUBLIC_BACKEND_API_URL` is Injected by Aspire at Runtime

Do **not** hardcode this value anywhere. It is only available after Aspire wires the services together. In dev without Aspire, set it in `.env.local`.

### 6. Dual Prisma — Schema Drift Risk

Both `AASD.Angular` (Express SSR) and `AASD.NextJS` use Prisma against the **same PostgreSQL database**. `AASD.Backend` uses EF Core migrations against the same DB.

- Never run `prisma migrate dev` or `prisma db push` without understanding what EF Core migrations have already applied.
- Schema changes must be coordinated across **all three** data access layers.
- When in doubt, read the EF Core migration history before touching Prisma schema.

### 7. Angular Uses Prisma Directly — This Is Intentional

The Angular SSR Express server queries the database via Prisma. This is a deliberate architectural choice for the beauty contest (comparing full-stack patterns). Do not refactor it to call the shared backend API unless explicitly asked.

### 8. `suppressHydrationWarning` on `<body>` in Next.js

The Next.js root layout sets `suppressHydrationWarning` on `<body>`. This is intentional — browser extensions inject attributes that cause false hydration mismatches. Do not remove it.

---

## Backend Architecture Rules

The backend follows Clean Architecture with strict layer ordering:

```
Domain → Application → Infrastructure → API
```

- **Never skip layers** (e.g., API must not reference Domain directly for business logic).
- **Domain entities** have private setters and are sealed. Mutate via domain methods only — never set properties directly from outside the entity.
- **CQRS** is custom (no MediatR). Dispatch via `CommandDispatcher` / `QueryDispatcher` (resolved from DI).
- **Repository pattern:** repos have no mutation methods. Persist changes only via `UnitOfWork.SaveChangesAsync()`.
- **Message ordering** is sequence-based, not timestamp-based. Always use `GetNextMessageSequenceAsync()` when inserting messages.
- **DTO mapping:** always null-check navigation properties before mapping. Use fail-fast assertions — do not silently swallow missing relations.

---

## Sub-project AGENTS.md Files

Always read the relevant sub-project guide before editing that area:

| Sub-project | AGENTS.md |
|---|---|
| Next.js frontend | `src/AASD.NextJS/AGENTS.md` |
| Angular frontend | `src/AASD.Angular/AGENTS.md` |
| .NET Backend | `src/AASD.Backend/AGENTS.md` |
| Aspire Orchestration | `src/AASD.Orchestration/AGENTS.md` |

---

## General Agent Guidance

- **Preserve conventions.** Both frontends must remain feature-equivalent — if you add a feature to one, the other needs it too (unless the task is explicitly frontend-specific).
- **Do not commit secrets.** `.env`, `.env.local`, connection strings, and API keys must never be committed.
- **Run Aspire before assuming something is broken.** Many environment variables only resolve at Aspire startup.
- **Check EF Core migrations** before any database schema work. The migration history is the source of truth for the DB schema.
- **Test isolation:** Angular uses Vitest; Next.js uses Jest (or Vitest — check `package.json`). Run tests from the sub-project directory, not the root.
