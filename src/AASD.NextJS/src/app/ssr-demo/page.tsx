import type { Metadata } from 'next'
import { Suspense } from 'react'
import StatsCard from '@/components/ssr/StatsCard'
import ConversationStats from '@/components/ssr/ConversationStats'
import UserList from '@/components/ssr/UserList'
import { FlightPayloadViewer } from '@/components/ssr/FlightPayloadViewer'
import { ServerRenderBadge } from '@/components/ui/RenderBadge'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  getConversationsFromBackend,
  getMessagesFromBackend,
  getUsersFromBackend,
} from '@/lib/backend'

export const metadata: Metadata = { title: 'SSR Demo' }

// RSC 1: fetch stats in parallel (no waterfall)
async function fetchStats() {
  const [conversations, users] = await Promise.all([
    getConversationsFromBackend(),
    getUsersFromBackend(),
  ])

  const messageCountByConversation = await Promise.all(
    conversations.map((conversation) =>
      getMessagesFromBackend(conversation.id).then((messages) => messages.length),
    ),
  )

  const convCount = conversations.length
  const msgCount = messageCountByConversation.reduce((sum, count) => sum + count, 0)
  const userCount = users.length
  return { convCount, msgCount, userCount }
}

// use cache demo (Next.js 15)
async function getCachedStats() {
  'use cache'
  return fetchStats()
}

export default async function SsrDemoPage() {
  // Fetch is initiated server-side - zero client JS for this data
  const statsPromise = getCachedStats()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <PageHeader
          heading="Server-Side Rendering Demo"
          description="This page demonstrates how Next.js renders components on the server. Green badges indicate server-rendered content; blue badges appear after client-side hydration."
        />
        <div className="mb-4">
          <ServerRenderBadge label="Server Component · SSR · this page" />
        </div>

        {/* Legend */}
        <div className="rounded-xl border border-border bg-surface-2 p-4 space-y-2 text-sm">
          <p className="font-semibold text-text mb-3">How to read the badges:</p>
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Server Component · SSR
            </span>
            <span className="text-text-muted">
              Rendered on the server at request time. The timestamp is frozen — it never changes in
              the browser. Content is visible even with JavaScript disabled.
            </span>
          </div>
          <div className="flex items-start gap-3 pt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Client Component · CSR
            </span>
            <span className="text-text-muted">
              Hydrated in the browser after the initial HTML is delivered. The timestamp updates
              each time the component mounts. Not visible without JavaScript.
            </span>
          </div>
        </div>
      </div>

      {/* Streaming with Suspense */}
      <section>
        <h2 className="text-xl font-semibold mb-4">1. Parallel fetch (no waterfall)</h2>
        <p className="text-sm text-text-muted mb-4">
          All three stats are fetched with <code className="bg-surface-2 px-1 rounded">Promise.all</code> server-side.
        </p>
        <Suspense fallback={<div className="grid grid-cols-3 gap-4 animate-pulse">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-surface-2 rounded-xl" />)}</div>}>
          <StatsSection statsPromise={statsPromise} />
        </Suspense>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">2. Streaming con Suspense</h2>
        <p className="text-sm text-text-muted mb-4">
          Each section streams independently - heavy components don&apos;t block the page.
        </p>
        <div className="grid grid-cols-2 gap-6">
          <Suspense fallback={<div className="h-48 bg-surface-2 rounded-xl animate-pulse" />}>
            <ConversationStats />
          </Suspense>
          <Suspense fallback={<div className="h-48 bg-surface-2 rounded-xl animate-pulse" />}>
            <UserList />
          </Suspense>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">3. <code className="text-primary">use cache</code> (Next.js 15)</h2>
        <div className="bg-gray-900 rounded-xl p-4 text-sm font-mono text-green-400 overflow-x-auto">
          <pre>{`async function getCachedStats() {
  'use cache'  // Next.js 15 - caches the return value
  return fetchStats()
}`}</pre>
        </div>
        <p className="text-sm text-text-muted mt-3">
          The stats above are cached server-side. Subsequent requests serve from cache without hitting the DB.
        </p>
      </section>

      {/*
       * T18 — React Flight Protocol (RSC) viewer
       *
       * The stats object below was fetched entirely server-side (RSC). When Next.js serialises
       * this page it encodes the props via the React Flight Protocol (also called "RSC payload"
       * or "Flight wire format"). Passing server-fetched data down to a Client Component is the
       * canonical pattern — the data travels as plain JSON inside the Flight payload rather than
       * being re-fetched on the client.
       */}
      <section>
        <h2 className="text-xl font-semibold mb-2">4. React Flight Protocol — RSC data handoff</h2>
        <p className="text-sm text-text-muted mb-4">
          Server-fetched props serialised via the React Flight Protocol and handed to a Client Component.
          Expand to inspect the raw payload that was computed on the server.
        </p>
        <Suspense fallback={<div className="h-12 bg-surface-2 rounded-xl animate-pulse" />}>
          <FlightViewerSection statsPromise={statsPromise} />
        </Suspense>
      </section>
    </div>
  )
}

async function StatsSection({ statsPromise }: { statsPromise: Promise<{ convCount: number; msgCount: number; userCount: number }> }) {
  const { convCount, msgCount, userCount } = await statsPromise
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatsCard label="Conversations" value={convCount} icon="💬" />
      <StatsCard label="Messages" value={msgCount} icon="✉️" />
      <StatsCard label="Users" value={userCount} icon="👤" />
    </div>
  )
}

/** Awaits the cached stats and hands the resolved value to the Flight viewer client component. */
async function FlightViewerSection({ statsPromise }: { statsPromise: Promise<{ convCount: number; msgCount: number; userCount: number }> }) {
  const stats = await statsPromise
  return (
    <FlightPayloadViewer
      data={stats}
      title="React Flight Payload — cached SSR stats"
    />
  )
}
