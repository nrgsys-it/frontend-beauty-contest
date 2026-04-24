# AASD.NextJS — Beauty Contest

Chat application built with **Next.js 15** (App Router) to evaluate the framework for the AASD product frontend selection.

## Stack
- **Next.js 15** — App Router, React Server Components, Server Actions
- **TypeScript 5** — strict mode
- **Tailwind CSS v4** — CSS-first configuration
- **Prisma** — shared schema with Angular branch
- **ASP.NET Backend API** — shared conversation/message persistence
- **SignalR client** — real-time messaging via backend hub
- **Zustand** — client-side state
- **NextAuth.js v5** — SSR-first authentication
- **TanStack Query v5** — client data fetching
- **Framer Motion** — animations
- **Zod** — schema validation

## Getting Started

```bash
npm install
npm run dev         # Next.js on PORT env (default 3001)
npm run start:aspire
```

## Environment

Copy `.env.example` to `.env.local` and fill in values. In Aspire mode, `PORT`, `BACKEND_API_URL`, and `NEXT_PUBLIC_BACKEND_API_URL` are injected automatically.

## Architecture

- `app/` — App Router pages, layouts, Server Components
- `app/actions/` — Server Actions that call the shared backend
- `components/` — Reusable React components
- `lib/` — Utilities, backend API client, auth config
- `prisma/` — Schema and migrations
