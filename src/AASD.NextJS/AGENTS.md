# AGENTS.md — AASD.NextJS

> Sub-project guide for AI coding agents. Read this before touching any file in `src/AASD.NextJS/`.
> Also read the root `AGENTS.md` for cross-cutting constraints that apply to all sub-projects.

---

## What This Project Is

A **Next.js 15.3.1** (App Router, React 19) chat frontend. It is one half of the AASD beauty contest — the Angular SSR frontend is the other. Both must remain feature-equivalent.

Primary capabilities demonstrated here:
- **React Server Components** for initial data fetch (SSR)
- **Server Actions** for mutations (send message, create conversation)
- **SignalR** real-time messaging via `@microsoft/signalr`
- **Zustand 5** for client-side state (active conversation, live messages)
- **React Query 5** (TanStack Query) for client-side data caching/polling
- **Framer Motion** for UI animations
- **Prisma 6** direct database access (same PostgreSQL DB as the .NET backend)

---

## Directory Structure

```
src/AASD.NextJS/
├── next.config.ts                  # Next.js config (experimental.useCache enabled)
├── package.json
├── tsconfig.json                   # Strict mode; path alias @/* → src/*
├── prisma/
│   └── schema.prisma               # Prisma 6 schema — same DB as EF Core
└── src/
    ├── app/                        # App Router root
    │   ├── layout.tsx              # Root layout — suppressHydrationWarning on <body>
    │   ├── page.tsx                # Home page (RSC)
    │   ├── not-found.tsx           # 404 page
    │   ├── error.tsx               # Root error boundary ("use client")
    │   ├── loading.tsx             # Root loading UI
    │   ├── actions/
    │   │   └── messages.ts         # Server Actions: sendMessage, createConversation, getConversations, getMessages, getUsers
    │   ├── chat/
    │   │   ├── page.tsx            # Chat page (RSC — fetches conversations server-side)
    │   │   ├── error.tsx           # Chat-scoped error boundary
    │   │   └── loading.tsx         # Chat loading skeleton
    │   ├── ssr-demo/
    │   │   ├── page.tsx            # SSR demonstration page
    │   │   └── loading.tsx
    │   ├── ws-demo/
    │   │   └── page.tsx            # SignalR demo page
    │   ├── libs-demo/
    │   │   └── page.tsx            # Library showcase page (Zustand, React Query, Framer Motion, Zod)
    │   └── settings/
    │       ├── page.tsx
    │       └── loading.tsx
    ├── components/
    │   ├── chat/
    │   │   ├── ChatLayout.tsx         # "use client" — master chat shell, owns SignalR subscription
    │   │   ├── ConversationList.tsx   # "use client" — sidebar conversation list
    │   │   ├── ConversationListSkeleton.tsx
    │   │   ├── MessageArea.tsx        # "use client" — message thread + send form
    │   │   └── WsStatusBadge.tsx      # "use client" — realtime connection indicator
    │   ├── ssr/
    │   │   ├── ConversationStats.tsx  # RSC — stats card rendered server-side
    │   │   ├── UserList.tsx           # RSC — server-rendered user list
    │   │   └── StatsCard.tsx          # RSC — generic stats card
    │   ├── ws/
    │   │   └── WsDemo.tsx             # "use client" — interactive SignalR demo
    │   ├── libs/
    │   │   ├── ZustandDemo.tsx        # "use client"
    │   │   ├── TanStackQueryDemo.tsx  # "use client"
    │   │   ├── MotionDemo.tsx         # "use client"
    │   │   ├── ZodDemo.tsx            # "use client"
    │   │   └── ShadcnDemo.tsx         # "use client"
    │   └── providers/
    │       └── QueryProvider.tsx      # "use client" — TanStack Query client provider
    ├── hooks/
    │   └── useWebSocket.ts            # "use client" — SignalR connection lifecycle hook
    └── lib/
        ├── backend.ts                 # Backend API helpers: getBackendApiUrl, getBackendHubUrl, backendRequest, ...
        ├── types.ts                   # Shared TypeScript types (UserSummary, MessageWithSender, etc.)
        ├── store.ts                   # Zustand store: useChatStore (ChatState)
        ├── prisma.ts                  # Prisma singleton (dev hot-reload safe)
        └── dateUtils.ts               # Date formatting helpers
```

---

## Environment Variables

| Variable | Where set | Purpose |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_API_URL` | Injected by Aspire at runtime; `.env.local` for local dev | Base URL for all backend API calls and SignalR hub derivation |
| `BACKEND_API_URL` | Injected by Aspire (server-side only) | Server-side override — takes priority over `NEXT_PUBLIC_BACKEND_API_URL` on the server |
| `NEXT_PUBLIC_BACKEND_HUB_URL` | Optional override | Explicit SignalR hub URL. If absent, hub URL = `${NEXT_PUBLIC_BACKEND_API_URL}/chat-hub` |
| `NEXT_PUBLIC_WS_URL` | **DO NOT USE** | Orphan variable — not the hub endpoint. See critical rules. |
| `DATABASE_URL` | `.env` / Aspire | Prisma connection string |
| `PORT` | Injected by Aspire | Must be 3001. Never hardcode. |

Never commit `.env`, `.env.local`, or any file containing secrets.

---

## Running the Project

```bash
# Development (port defaults to 3001)
npm run dev

# Production mode (Aspire-managed — Next.js reads PORT env var injected by Aspire)
npm run start:aspire

# Build
npm run build

# Lint
npm run lint
```

> `start:aspire` is just `next dev` — no port flag, no host flag. Aspire injects `PORT=3000`
> (the internal/target port) and Next.js reads it automatically. Aspire's YARP proxy exposes
> port **3001** externally and routes to Next.js on port 3000. Do **not** add `-p`, `-H`, or
> any explicit port — let the `PORT` env var drive it.

---

## Critical Rules

### 1. External Port Is Fixed at 3001; Internal Port Is 3000

Aspire's `AppHost.cs` uses `.WithHttpEndpoint(port: 3001, targetPort: 3000, env: "PORT")`:
- **External (YARP/browser):** 3001 — do not change this.
- **Internal (Next.js process):** 3000 — Aspire injects `PORT=3000` and YARP proxies 3001→3000.

The `start:aspire` script must **not** hardcode `-p 3001` (that would cause a port conflict with
Aspire's YARP proxy). Always leave the port to the `PORT` env var.

### 2. SignalR — Always Use `@microsoft/signalr`

- Import from `@microsoft/signalr`, never from native `WebSocket`.
- Transport flags: `HttpTransportType.WebSockets | HttpTransportType.LongPolling`.
- **Always set `withCredentials: false`** — the backend CORS policy uses `AllowAnyOrigin()`, which is incompatible with credentials.
- Hub URL is derived at runtime from `getBackendHubUrl()` (in `src/lib/backend.ts`). Do **not** hardcode `/chat-hub`.

```ts
// Correct pattern — copy from useWebSocket.ts
const connection = new HubConnectionBuilder()
  .withUrl(getBackendHubUrl(), {
    transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
    withCredentials: false,
  })
  .withAutomaticReconnect([0, 2000, 5000, 10000])
  .configureLogging(LogLevel.Warning)
  .build()
```

### 3. `NEXT_PUBLIC_WS_URL` Is an Orphan — Do Not Use It

This env var exists in the environment but is **not** the SignalR hub URL. Never pass it to `HubConnectionBuilder`. Always derive the hub URL from `getBackendHubUrl()`.

### 4. `NEXT_PUBLIC_BACKEND_API_URL` Is Injected at Runtime

Do **not** hardcode this value. In `src/lib/backend.ts` the fallback `http://localhost:5208` is only for local dev without Aspire. In production (Aspire), Aspire injects the correct URL.

For local dev without Aspire, add to `.env.local`:
```
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5208
```

### 5. `suppressHydrationWarning` on `<body>` — Do Not Remove

`layout.tsx` sets `suppressHydrationWarning` on `<body>`. This suppresses false hydration mismatches caused by browser extensions injecting attributes (e.g., `data-lt-installed`). **Do not remove it.**

### 6. Prisma — Coordinate with EF Core Before Any Schema Change

Both this Next.js app (Prisma 6) and `AASD.Backend` (EF Core 9) point at the **same PostgreSQL database**.

- **Never** run `prisma migrate dev` or `prisma db push` without first reading the EF Core migration history in `src/AASD.Backend/AASD.Backend.Infrastructure/Migrations/`.
- EF Core migration history is the source of truth for the live schema.
- Schema changes must be coordinated across Prisma schema, EF Core migrations, and the Angular Prisma schema.
- Only use `prisma generate` to regenerate the client after a schema sync.

### 7. Prisma Singleton Pattern — Do Not Break It

`src/lib/prisma.ts` uses `globalThis` to keep a single `PrismaClient` across Next.js hot-reloads in dev. **Never** instantiate `new PrismaClient()` directly in any other file — always import `prisma` from `@/lib/prisma`.

### 8. Server Components vs Client Components

| Use RSC (`async function`, no directive) | Use Client Component (`"use client"`) |
|---|---|
| Initial data fetch via `backendRequest` / Server Actions | Hooks (`useState`, `useEffect`, custom hooks) |
| Static / rarely changing UI | SignalR / WebSocket connections |
| `layout.tsx`, route `page.tsx` (when no interactivity) | Zustand store consumers |
| SSR demonstration pages | Forms, click handlers, animations |

**Rule of thumb:** push `"use client"` as deep as possible. Keep `page.tsx` files as RSC; pass server-fetched data down as props to client components.

### 9. `experimental.useCache` Is Enabled — Do Not Disable It

`next.config.ts` enables `experimental.useCache: true`. This opts in to the `"use cache"` directive support in Next.js 15. Do not remove this flag.

### 10. Server Actions Live in `src/app/actions/`

All mutations and server-side data fetches that need to be callable from client components go in `src/app/actions/messages.ts` (or new files under `src/app/actions/`). They must start with `'use server'`. Use Zod for input validation before calling the backend.

---

## State Management

The Zustand store (`src/lib/store.ts`) holds:

| State slice | Purpose |
|---|---|
| `activeConversationId` | Which conversation is selected in the chat UI |
| `conversations` | Full conversation list (set once on load) |
| `liveMessages` | Map of `conversationId → MessageWithSender[]` — messages received via SignalR |
| `wsStatus` | Current SignalR connection state |

**Pattern:** RSC pages fetch initial data → pass as props to client `ChatLayout` → `ChatLayout` seeds the Zustand store → SignalR hook pushes live messages via `addLiveMessage`.

Do not add React Query state for data that already lives in Zustand. Use React Query for independent polling/refetch needs (e.g., the libs-demo page).

---

## Adding a New Feature

### New page (RSC)

1. Create `src/app/<route>/page.tsx` — `async` function, no `"use client"`.
2. Fetch data via Server Actions from `src/app/actions/` or directly via `backendRequest`.
3. Add `loading.tsx` and `error.tsx` sibling files for Suspense/error boundaries.
4. Add a `<Link>` entry in `src/app/layout.tsx` nav if it's a top-level route.

### New interactive component

1. Create under `src/components/<feature>/MyComponent.tsx`.
2. Add `"use client"` at the top.
3. Accept server-fetched data as props — do not fetch inside client components when an RSC parent can do it.
4. Use `useChatStore` for shared state; local `useState` for component-scoped state.

### New Server Action

1. Add to `src/app/actions/messages.ts` or create `src/app/actions/<feature>.ts`.
2. Add `'use server'` directive.
3. Validate all inputs with Zod before calling the backend.
4. Call `revalidatePath(...)` after mutations that affect cached RSC data.
5. Return typed result objects — never throw from a Server Action called by a client component.

### New SignalR subscription

1. Extend `useWebSocket.ts` or create a new hook under `src/hooks/`.
2. Always derive hub URL from `getBackendHubUrl()`.
3. Always `withCredentials: false`.
4. Tear down the connection in the `useEffect` cleanup.

### New backend API call

1. Add a typed helper to `src/lib/backend.ts` using `backendRequest<T>`.
2. Add a Server Action wrapper in `src/app/actions/` if it needs to be called from a client component.
3. Add the corresponding type to `src/lib/types.ts` if it is a new shape.

---

## What NOT to Do

| ❌ Don't | ✅ Do instead |
|---|---|
| Hardcode port, API URL, or hub URL | Use env vars; call `getBackendApiUrl()` / `getBackendHubUrl()` |
| Use `NEXT_PUBLIC_WS_URL` as the SignalR endpoint | Derive hub URL from `getBackendHubUrl()` |
| Set `withCredentials: true` on SignalR | Always `withCredentials: false` |
| `new PrismaClient()` outside `src/lib/prisma.ts` | Import `prisma` from `@/lib/prisma` |
| Run `prisma migrate dev` without checking EF Core history | Read `AASD.Backend.Infrastructure/Migrations/` first |
| Remove `suppressHydrationWarning` from `<body>` | Leave it — it's intentional |
| Disable `experimental.useCache` in `next.config.ts` | Leave it enabled |
| Fetch data inside client components when a parent RSC can do it | Fetch in RSC page; pass as props |
| Throw from a Server Action called by a client component | Return `{ error: string }` result objects |
| Change the Angular frontend without updating Next.js (or vice versa) | Keep both frontends feature-equivalent |
| Import server-only modules (Prisma, Server Actions) into client components | Use Server Actions as the boundary |

---

## TypeScript Conventions

- Strict mode is on — no `any`, no non-null assertions without comment.
- Path alias `@/*` maps to `src/*`. Always use `@/` for intra-project imports.
- Types shared across features live in `src/lib/types.ts`.
- Zod schemas for runtime validation live alongside the Server Actions that use them (currently in `src/app/actions/messages.ts`).

---

## Key API Endpoints (Backend)

All calls go through helpers in `src/lib/backend.ts`:

| Endpoint | Method | Helper |
|---|---|---|
| `/api/users` | GET | `getUsersFromBackend()` |
| `/api/conversations` | GET | `getConversationsFromBackend()` |
| `/api/conversations` | POST | `backendRequest` via `createConversation` action |
| `/api/conversations/:id/messages` | GET | `getMessagesFromBackend(id)` |
| `/api/conversations/:id/messages` | POST | `backendRequest` via `sendMessage` action |
| `/chat-hub` | SignalR | `getBackendHubUrl()` → `useWebSocket` |

SignalR hub methods invoked from client:
- `JoinConversation(conversationId, userId)` — called after connect and on reconnect
- `LeaveConversation(conversationId)` — called in cleanup

SignalR events received from hub:
- `ReceiveMessage` → `MessageWithSender` payload

---

## Navigation Routes

| Route | Component type | Purpose |
|---|---|---|
| `/` | RSC | Home / landing |
| `/chat` | RSC shell + client children | Main chat UI |
| `/ssr-demo` | RSC | Demonstrates server-side rendering |
| `/ws-demo` | RSC shell + `"use client"` | Demonstrates SignalR |
| `/libs-demo` | RSC shell + `"use client"` | Showcases Zustand, React Query, Framer Motion, Zod |
| `/settings` | RSC | Settings page |
