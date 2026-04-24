# AASD.NextJS — Beauty Contest

Chat application built with **Next.js 15** (App Router) to evaluate the framework for the AASD product frontend selection.

## Stack
- **Next.js 15** — App Router, React Server Components, Server Actions
- **TypeScript 5** — strict mode
- **Tailwind CSS v4** — CSS-first configuration
- **Prisma** — shared schema with Angular branch
- **WebSocket (native `ws`)** — real-time messaging (separate process)
- **Zustand** — client-side state
- **NextAuth.js v5** — SSR-first authentication
- **TanStack Query v5** — client data fetching
- **Framer Motion** — animations
- **Zod** — schema validation

## Getting Started

```bash
npm install
npm run dev        # Next.js on PORT env (default 3001)
npm run ws-server  # WebSocket server on WS_PORT (default 3002)
```

## Environment

Copy `.env.example` to `.env.local` and fill in values. When running via .NET Aspire, `PORT` and `DATABASE_URL` are injected automatically.

## Architecture

- `app/` — App Router pages, layouts, Server Components
- `app/actions/` — Server Actions (data mutations)
- `components/` — Reusable React components
- `lib/` — Utilities, Prisma singleton, auth config
- `ws-server/` — Standalone WebSocket server (separate process)
- `prisma/` — Schema and migrations
