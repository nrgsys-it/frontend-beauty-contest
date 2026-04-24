# Frontend Beauty Contest

A side-by-side evaluation of **Angular**, **Next.js**, and **Flutter** as candidates for the next frontend stack. Three developers build the same chat application — one per framework — sharing a common .NET Aspire + PostgreSQL backend. The winner becomes the team's production choice.

---

## What is a Beauty Contest?

A beauty contest is a structured spike where each candidate is pushed to its limits on a realistic application. Every branch must demonstrate:

| Criterion | Description |
|-----------|-------------|
| **SSR / Rendering** | Server-side rendering, static generation, or equivalent |
| **Real-time** | Live WebSocket messaging |
| **Component lifecycle** | Pitfalls, cleanup, and gotchas documented |
| **Library ecosystem** | Curated picks for state, forms, queries, animation |
| **Community health** | npm trends, GitHub stars, job market signal |

---

## Repository Structure

```
frontend-beauty-contest/
├── README.md                        ← you are here
└── src/
    ├── AASD.sln                     ← solution file (Aspire + all projects)
    ├── AASD.Orchestration/          ← .NET Aspire AppHost — orchestrates everything
    ├── AASD.Angular/                ← Angular 21 branch (SSR via Universal)
    ├── AASD.NextJS/                 ← Next.js 15 branch (App Router, RSC)
    └── docs/
        ├── angular.md               ← Angular beauty contest report
        ├── nextjs.md                ← Next.js beauty contest report
        └── nextjs-lifecycle.md      ← Next.js component lifecycle deep-dive
```

> Flutter branch is planned but not yet started.

---

## The Demo App — Chat

All three frontends implement the same feature set:

- **Conversations list** — persisted in PostgreSQL
- **Real-time messaging** — native WebSocket (no SignalR, no SSE)
- **SSR demo page** — server-rendered stats and user list
- **Library showcase** — state management, animation, data fetching
- **Settings page** — basic profile/theme toggles

---

## Infrastructure

### .NET Aspire Orchestrator

The `AASD.Orchestration` AppHost wires everything together:

| Resource | Details |
|----------|---------|
| PostgreSQL | Container `aacd`, host port `51214`, persistent volume |
| Database | `data` |
| Angular app | npm script `start`, port injected via `PORT` env var |
| Next.js app | npm script `start:aspire` (Next.js dev + WS server via `concurrently`), port injected via `PORT` env var |

The `DATABASE_URL` connection string is injected automatically by Aspire into both apps.

### Running with Aspire (recommended)

Prerequisites: .NET 9 SDK, Docker Desktop, Node.js 20+.

```bash
cd src
dotnet run --project AASD.Orchestration
```

Aspire will start the database container, run migrations, and launch all registered apps. The Aspire dashboard is available at `https://localhost:15888`.

### Running standalone (without Aspire)

**Angular:**
```bash
cd src/AASD.Angular
cp .env.example .env          # set DATABASE_URL
npm install
npm run start
```

**Next.js:**
```bash
cd src/AASD.NextJS
cp .env.example .env          # set DATABASE_URL and WS_PORT
npm install
npx prisma migrate deploy
npm run dev                   # Next.js only
npm run ws-server             # WS server (separate terminal)
# or both together:
npm run start:aspire
```

---

## License

Internal evaluation project. Not for distribution.
