'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'

// Simulates a real API call — polls for user count that increments over time
async function fetchStats() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  // Simulate a slowly growing user count based on time
  const base = 128
  const drift = Math.floor(Date.now() / 30_000) % 10
  return {
    conversations: [
      { id: '1', title: 'General', messageCount: 42 + drift },
      { id: '2', title: 'Support', messageCount: 7 + Math.floor(drift / 2) },
      { id: '3', title: 'Random', messageCount: 128 + drift * 3 },
    ],
    activeUsers: base + drift,
    fetchedAt: Date.now(),
  }
}

export default function TanStackQueryDemo() {
  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['conversations-demo'],
    queryFn: fetchStats,
    staleTime: 8_000,
    // Poll every 10 s — demonstrates live-updating query
    refetchInterval: 10_000,
    // Refetch whenever the tab regains focus
    refetchOnWindowFocus: true,
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {isLoading && <span className="text-yellow-600">Loading…</span>}
          {isFetching && !isLoading && <span className="text-blue-600 animate-pulse">Refetching…</span>}
          {!isLoading && !isFetching && <span className="text-green-600">✓ Fresh</span>}

          {/* Active users counter — animates when value changes */}
          <AnimatePresence mode="wait">
            {data && (
              <motion.span
                key={data.activeUsers}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className="ml-3 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200"
              >
                {data.activeUsers} active users
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          Refetch now
        </button>
      </div>

      {data && (
        <ul className="divide-y divide-gray-100">
          <AnimatePresence initial={false}>
            {data.conversations.map((conversation) => (
              <motion.li
                key={conversation.id}
                layout
                className="py-2 flex justify-between text-sm"
              >
                <span className="text-gray-700">{conversation.title}</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={conversation.messageCount}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-gray-400"
                  >
                    {conversation.messageCount} msgs
                  </motion.span>
                </AnimatePresence>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {dataUpdatedAt > 0 && (
        <p className="text-xs text-gray-400">
          Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()} · polls every 10 s · refetches on focus
        </p>
      )}
    </div>
  )
}
