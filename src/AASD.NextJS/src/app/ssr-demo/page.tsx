import type { Metadata } from 'next'
import { Suspense } from 'react'
import StatsCard from '@/components/ssr/StatsCard'
import ConversationStats from '@/components/ssr/ConversationStats'
import UserList from '@/components/ssr/UserList'
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SSR Demo</h1>
        <p className="text-gray-500">
          This page is rendered server-side. Disable JavaScript - content is still visible.
        </p>
        <div className="mt-2 inline-flex items-center gap-2 text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          React Server Component - no client bundle
        </div>
      </div>

      {/* Streaming with Suspense */}
      <section>
        <h2 className="text-xl font-semibold mb-4">1. Parallel fetch (no waterfall)</h2>
        <p className="text-sm text-gray-500 mb-4">
          All three stats are fetched with <code className="bg-gray-100 px-1 rounded">Promise.all</code> server-side.
        </p>
        <Suspense fallback={<div className="grid grid-cols-3 gap-4 animate-pulse">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}</div>}>
          <StatsSection statsPromise={statsPromise} />
        </Suspense>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">2. Streaming con Suspense</h2>
        <p className="text-sm text-gray-500 mb-4">
          Each section streams independently - heavy components don&apos;t block the page.
        </p>
        <div className="grid grid-cols-2 gap-6">
          <Suspense fallback={<div className="h-48 bg-gray-100 rounded-xl animate-pulse" />}>
            <ConversationStats />
          </Suspense>
          <Suspense fallback={<div className="h-48 bg-gray-100 rounded-xl animate-pulse" />}>
            <UserList />
          </Suspense>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">3. <code className="text-blue-600">use cache</code> (Next.js 15)</h2>
        <div className="bg-gray-900 rounded-xl p-4 text-sm font-mono text-green-400 overflow-x-auto">
          <pre>{`async function getCachedStats() {
  'use cache'  // Next.js 15 - caches the return value
  return fetchStats()
}`}</pre>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          The stats above are cached server-side. Subsequent requests serve from cache without hitting the DB.
        </p>
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
