# AGENTS.md — AASD.Angular

> Sub-project guide for AI coding agents. Read this **in addition to** the root `AGENTS.md` before touching any file in `src/AASD.Angular/`.

---

## Overview

`AASD.Angular` is an **Angular 21 SSR** frontend application. It is one of two frontend implementations in the beauty contest (the other is `AASD.NextJS`). The Angular app is a full-stack SSR node process: the Express server both renders Angular pages and serves a small REST API backed directly by **Prisma** against the shared PostgreSQL database.

The app is feature-equivalent to `AASD.NextJS`. If you add a feature here, add it to Next.js too (unless the task is explicitly Angular-specific).

---

## Repository Structure

```
src/AASD.Angular/
├── angular.json                        # Angular CLI configuration
├── package.json
├── tsconfig*.json
├── prisma/
│   ├── schema.prisma                   # Prisma schema (mirrors EF Core DB)
│   └── seed.ts                         # DB seed script
├── public/                             # Static assets (served from /browser root)
└── src/
    ├── main.ts                         # Browser bootstrap entry point
    ├── main.server.ts                  # Server bootstrap entry point
    ├── server.ts                       # Express server — API routes + SSR handler
    ├── styles.css                      # Global Tailwind CSS entry
    ├── server/
    │   ├── prisma.ts                   # Singleton PrismaClient (pg adapter)
    │   └── gateways/
    │       ├── conversationGateway.ts  # Prisma: conversation queries
    │       └── userGateway.ts          # Prisma: user queries
    └── app/
        ├── app.ts                      # Root component
        ├── app.html / app.css
        ├── app.config.ts               # Client ApplicationConfig (providers)
        ├── app.config.server.ts        # Server ApplicationConfig (merges client)
        ├── app.routes.ts               # Client-side router routes
        ├── app.routes.server.ts        # SSR render mode config (Prerender)
        ├── app.spec.ts                 # Root component smoke test
        ├── components/
        │   ├── chat-page/              # Main chat UI
        │   ├── header/                 # App header
        │   ├── home-page/              # Landing page (user selection)
        │   ├── settings-page/          # Settings page
        ├── layouts/
        │   └── main-layout/            # App shell / layout wrapper
        └── services/
            ├── userSelectionStateService.ts    # Signal-based selected user state
            ├── conversationListService.ts      # HTTP GET /api/conversations
            └── userListService.ts              # HTTP GET /api/users
```

### File naming conventions

| Artifact | Convention | Example |
|---|---|---|
| Component class | PascalCase, filename kebab-case | `chat-page.ts` → `ChatPage` |
| Service class | camelCase filename | `conversationListService.ts` → `ConversationListService` |
| Gateway object | camelCase filename | `conversationGateway.ts` → `conversationGateway` |
| Template | same stem, `.html` | `chat-page.html` |
| Styles | same stem, `.css` | `chat-page.css` |
| Tests | same stem, `.spec.ts` | `chat-page.spec.ts` |

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | Angular 21.2 |
| Rendering | `@angular/ssr` (Angular Universal + Express 5) |
| State | Angular Signals (`signal`, `computed`, `effect`) |
| Async bridge | `toObservable()` from `@angular/core/rxjs-interop` |
| Reactive | RxJS 7.8 |
| Styling | Tailwind CSS 4 (`@tailwindcss/postcss`) |
| DB access | Prisma 7.8 with `@prisma/adapter-pg` (server-side only) |
| HTTP (client) | Angular `HttpClient` with `withFetch()` |
| Testing | Vitest 4 |
| Language | TypeScript 5.9 |

---

## Architecture

### Two-process mental model

At runtime there is **one Node.js process** (the compiled Express server) that does two jobs:

1. **REST API** — handles `/api/*` routes with Prisma.
2. **SSR** — renders Angular pages for all other routes via `AngularNodeAppEngine`.

```
Browser Request
       │
       ▼
  Express Server (src/server.ts)
       ├── GET /api/conversations?userId=X  ──► conversationGateway ──► Prisma ──► PostgreSQL
       ├── GET /api/users                   ──► userGateway          ──► Prisma ──► PostgreSQL
       ├── Static files (/browser/**)
       └── ** (everything else)             ──► AngularNodeAppEngine (SSR)
                                                       │
                                                       ▼
                                                 Rendered HTML
```

### Prisma Gateway pattern

All database queries live in `src/server/gateways/`. A gateway is a **plain object** with typed methods — it is **not** a class or Angular service. It imports the singleton `prisma` client from `src/server/prisma.ts`.

```ts
// Pattern: define an interface, export a const object
export interface ConversationGateway {
  getConversationsByUserId(userId: string): Promise<Conversation[]>;
}

export const conversationGateway: ConversationGateway = {
  getConversationsByUserId(userId) {
    return prisma.conversation.findMany({ where: { users: { some: { id: userId } } } });
  },
};
```

- Gateways are **server-only** — never import them in Angular components or services.
- `src/server/prisma.ts` uses a `globalThis` singleton pattern to prevent connection pool exhaustion during dev hot-reloads.
- `DATABASE_URL` is read at module load time; an explicit `Error` is thrown if it is missing.

### Signal-based state management

State is owned by `@Injectable({ providedIn: 'root' })` services using Angular Signals.

```ts
// Service: holds a signal
readonly selectedUser = signal<UserListItem | null>(null);
readonly isUserSelected = computed(() => this.selectedUser() !== null);

// Component: bridge to RxJS when you need async pipe / operators
readonly conversations$ = toObservable(this.userSelectionStateService.selectedUser).pipe(
  switchMap(selectedUser => selectedUser ? this.conversationListService.getList(selectedUser.id) : of([]))
);
```

**Rules:**
- Prefer `signal()` for leaf state.
- Use `computed()` for derived values — never recalculate in templates.
- Use `effect()` for side effects (logging, analytics). Do **not** use `effect()` to set other signals.
- Bridge signals → RxJS with `toObservable()` from `@angular/core/rxjs-interop` when you need operators like `switchMap`, `debounceTime`, etc.
- Bridge RxJS → template with `async` pipe (already in scope via `AsyncPipe` import).

### SSR safety — browser API access

The same code runs on the server (Node.js, no `window`) and in the browser. Always guard browser-only APIs:

```ts
import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';

// In a service constructor or injection context:
private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

if (this.isBrowser) {
  // sessionStorage, localStorage, window, document, etc.
}
```

**Never** access `sessionStorage`, `localStorage`, `window`, or `document` without an `isPlatformBrowser` guard. The SSR render will throw.

### SSR prerender mode

`src/app/app.routes.server.ts` sets `RenderMode.Prerender` for all routes (`**`). This means Angular pre-renders every route at build time. Routes that depend on dynamic runtime data (e.g., per-user conversations) must handle the empty/null initial state gracefully so the prerender does not error.

---

## Component Conventions

### Standalone components — no NgModules

Every component uses `standalone: true` (implicit in Angular 21 — the `@Component` decorator defaults to standalone). **Never add `NgModule`.**

```ts
@Component({
  selector: 'app-chat-page',
  imports: [AsyncPipe, FormsModule],   // ← import directly here
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.css',
})
export class ChatPage { ... }
```

- All required Angular directives (`NgIf`, `NgFor`, `AsyncPipe`, `RouterLink`, etc.) must be listed in the component's own `imports` array.
- Use `inject()` function for dependency injection — preferred over constructor injection in Angular 21.
- Constructor injection is acceptable for services that require `@Inject(TOKEN)` (e.g., `PLATFORM_ID`).

### Template and style co-location

Each component lives in its own folder with four files:

```
chat-page/
├── chat-page.ts      ← component class
├── chat-page.html    ← template
├── chat-page.css     ← component-scoped styles
└── chat-page.spec.ts ← unit tests
```

Do not use inline templates or inline styles unless the component is trivially small (< 5 lines).

### Selector naming

Use the `app-` prefix for all component selectors: `app-chat-page`, `app-header`, `app-main-layout`, etc. This matches the `prefix: "app"` setting in `angular.json`.

---

## Services

Services are `@Injectable({ providedIn: 'root' })` singletons.

| Service | Purpose | State mechanism |
|---|---|---|
| `UserSelectionStateService` | Tracks the currently selected user; persists to `sessionStorage` | `signal()` + `computed()` |
| `ConversationListService` | `GET /api/conversations?userId=X` | RxJS `Observable` (stateless) |
| `UserListService` | `GET /api/users` | RxJS `Observable` (stateless) |

### HTTP client

`HttpClient` is provided globally via `provideHttpClient(withFetch())` in `app.config.ts`. During SSR, the `withFetch()` flag enables the native Fetch API (required for Node 18+). Services call `this.httpClient.get<T>(relativeUrl)` — paths are relative (`/api/...`) and resolve correctly in both SSR and client contexts because Angular SSR uses absolute URLs internally.

---

## Express Server (`src/server.ts`)

The Express server is the compiled output entry point. Key things to know:

- It imports **gateways directly** — no Angular DI involved.
- API routes must be registered **before** `express.static` and the Angular SSR catch-all handler.
- The port is `process.env['PORT'] || 4000`. **Never hardcode 4000** in a way that ignores the env var — Aspire injects `PORT` at runtime.
- The server starts only when it is the main module (`isMainModule(import.meta.url)`) or running under PM2.

### Adding a new API route

1. Create a gateway in `src/server/gateways/myEntityGateway.ts`.
2. Register the route in `src/server.ts` **before** the static/SSR middleware.
3. Create a corresponding Angular service in `src/app/services/` that calls the new `/api/...` endpoint via `HttpClient`.

```ts
// server.ts — add before express.static(...)
app.get('/api/my-entity', async (req, res, next) => {
  try {
    const data = await myEntityGateway.getAll();
    res.json(data);
  } catch (error) {
    next(error);
  }
});
```

---

## Routing

Routes are defined in `src/app/app.routes.ts`:

| Path | Component |
|---|---|
| `/` | `HomePage` |
| `/chat` | `ChatPage` |
| `/settings` | `SettingsPage` |

### Adding a new route

1. Create the component folder under `src/app/components/my-page/`.
2. Import and add the route to `app.routes.ts`.
3. All routes inherit `RenderMode.Prerender` from `app.routes.server.ts` — no change needed unless you need a different render mode (e.g., `RenderMode.Server` for dynamic routes).

---

## Styling

Tailwind CSS 4 is configured via PostCSS (`@tailwindcss/postcss`). The global entry is `src/styles.css`. Component-specific styles go in the component's `.css` file (component-scoped by default via Angular's view encapsulation).

- Use Tailwind utility classes directly in templates.
- The `@tailwindplus/elements` package provides pre-built UI elements — check its docs before building custom UI.
- Do **not** add a `tailwind.config.js` — Tailwind 4 uses CSS-based configuration.

---

## Testing

Tests use **Vitest 4** (not Karma/Jasmine). Test files are co-located with components as `.spec.ts`.

```bash
# Run all tests (from src/AASD.Angular/)
npx vitest

# Run once (CI mode)
npx vitest run

# Watch mode
npx vitest --watch
```

- The `test` script in `package.json` delegates to `ng test` (which also invokes Vitest via `@angular/build:unit-test`).
- For SSR guard testing, provide a mock `PLATFORM_ID` token with `{ provide: PLATFORM_ID, useValue: 'browser' }` or `'server'`.

---

## Database / Prisma

### Schema location

```
src/AASD.Angular/prisma/
├── schema.prisma
└── seed.ts
```

### Critical constraints

1. **Never run `prisma migrate dev`** — the shared PostgreSQL database is managed by **EF Core migrations** in `AASD.Backend`. Running Prisma migrations will create a conflicting migration history.
2. **Use `prisma migrate deploy`** (the `db:migrate` script) — this applies existing migration SQL files without generating new ones.
3. **Schema drift:** if the EF Core migration history changes, `schema.prisma` must be updated to match. Always check `src/AASD.Backend/AASD.Backend.Infrastructure/Migrations/` before modifying `schema.prisma`.
4. **`DATABASE_URL`** is injected by Aspire at runtime. In local dev without Aspire, set it in a `.env` file at `src/AASD.Angular/.env` (this file must never be committed).

### PrismaClient singleton

`src/server/prisma.ts` instantiates a singleton via `globalThis` to avoid connection pool exhaustion across hot-reloads. Do not create additional `PrismaClient` instances elsewhere.

The client uses **`@prisma/adapter-pg`** (PostgreSQL driver adapter) — the connection string goes into the adapter, not the standard `datasource url` field. Keep this pattern when updating `schema.prisma`.

---

## Running the App

### Via Aspire (preferred — full stack)

```bash
# From repository root
dotnet run --project src/AASD.Orchestration
```

Aspire injects `PORT`, `DATABASE_URL`, and any other required env vars.

### Standalone (dev / debugging)

```bash
# Client-side only (no SSR, no Prisma, no API routes)
npm run start

# Full SSR mode (runs migrate → seed → build → serve)
npm run start:ssr

# Build only
npm run build

# Serve compiled SSR output directly
npm run serve:ssr:AASD.Angular

# Tests
npx vitest
```

> **Note:** `start:ssr` runs `prisma migrate deploy` and `prisma db seed` before building. Ensure `DATABASE_URL` is set in the environment or a `.env` file.

---

## Critical Constraints

### 1. Prisma is intentional — do not call the .NET backend from the Express server

The Angular SSR Express server queries the database **directly** via Prisma. This is a deliberate architectural choice for the beauty contest. Do **not** refactor the gateway layer to call `AASD.Backend` HTTP endpoints unless explicitly instructed.

### 2. Standalone components only

Never introduce `NgModule`. All Angular declarations must be standalone components with explicit `imports: []` arrays.

### 3. Signal-first state — no `BehaviorSubject` for state

New shared state must be implemented with `signal()` in a root-provided service. Use `computed()` for derived values. Bridge to RxJS with `toObservable()` only when RxJS operators are genuinely needed. Do not introduce `BehaviorSubject` or `ReplaySubject` as a state container.

### 4. SSR safety — always guard browser APIs

No `window`, `document`, `sessionStorage`, `localStorage`, or any browser-global access without an `isPlatformBrowser` check. Violations will crash the SSR render.

### 5. Port is controlled by environment

The server reads `process.env['PORT'] || 4000`. Do not hardcode port `4000` in any script, Aspire resource, or config that ignores the env var. Aspire injects `PORT` at runtime.

### 6. Schema drift with EF Core

`schema.prisma` must reflect the live EF Core database schema. Never run `prisma migrate dev` or `prisma db push`. Always check `AASD.Backend` migration history before modifying models.

### 7. API routes must precede the SSR catch-all in `server.ts`

Express processes middleware in registration order. Register all `app.get('/api/...')` routes **before** `express.static` and the `angularApp.handle` catch-all. Putting API routes after the catch-all will cause them to be swallowed by the SSR handler.

### 8. Gateways are server-only

Never import anything from `src/server/` in Angular components, services, or any file that may be bundled for the browser. The Prisma client and Node.js modules (`pg`, etc.) are not compatible with the browser bundle.

---

## How to Add a New Feature

### New page / route

1. Create `src/app/components/my-page/my-page.ts` (+ `.html`, `.css`, `.spec.ts`).
2. Add route in `src/app/app.routes.ts`.
3. If the page needs data, follow the data flow below.

### New data endpoint

1. **Gateway** — add `src/server/gateways/myEntityGateway.ts` following the existing pattern (interface + const object).
2. **Express route** — register `app.get('/api/my-entity', ...)` in `src/server.ts` before static/SSR middleware.
3. **Angular service** — add `src/app/services/myEntityService.ts` using `HttpClient.get<T>('/api/my-entity')`.
4. **Component** — inject the service; use `async` pipe for RxJS observables or `toSignal()` to convert to a signal.

### New shared state

1. Add a new signal to an existing service **or** create `src/app/services/myStateService.ts`.
2. Use `signal<T>(initialValue)` for mutable state.
3. Use `computed()` for derived values — export them as `readonly` properties.
4. Guard any `sessionStorage`/`localStorage` persistence with `isPlatformBrowser`.

### New Prisma model

1. Check `AASD.Backend` EF Core migration history first.
2. Update `prisma/schema.prisma` to match.
3. Run `npx prisma generate` to regenerate the client.
4. **Do not run `prisma migrate dev`** — migrations are owned by EF Core.
5. Add a gateway method and wire it up as described above.

---

## Relationship to AASD.NextJS

Both frontends must remain **feature-equivalent**. When you implement a feature in `AASD.Angular`:

- Check whether `AASD.NextJS` has the same feature.
- If not, implement it there too (or flag it clearly if the task is Angular-specific).
- API shapes exposed by the Express server (`/api/...`) are **Angular-specific** and do not need to match the Next.js API routes.
