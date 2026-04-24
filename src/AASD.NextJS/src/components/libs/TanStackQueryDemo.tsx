'use client'

import { useQuery } from '@tanstack/react-query'

async function fetchConversations() {
  await new Promise((resolve) => setTimeout(resolve, 500))

  return [
    { id: '1', title: 'General', messageCount: 42 },
    { id: '2', title: 'Support', messageCount: 7 },
    { id: '3', title: 'Random', messageCount: 128 },
  ]
}

export default function TanStackQueryDemo() {
  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['conversations-demo'],
    queryFn: fetchConversations,
    staleTime: 10_000,
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {isLoading && <span className="text-yellow-600">Loading...</span>}
          {isFetching && !isLoading && (
            <span className="text-blue-600">Refetching...</span>
          )}
          {!isLoading && !isFetching && (
            <span className="text-green-600">Fresh</span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          Refetch
        </button>
      </div>

      {data && (
        <ul className="divide-y divide-gray-100">
          {data.map((conversation) => (
            <li
              key={conversation.id}
              className="py-2 flex justify-between text-sm"
            >
              <span className="text-gray-700">{conversation.title}</span>
              <span className="text-gray-400">
                {conversation.messageCount} msgs
              </span>
            </li>
          ))}
        </ul>
      )}

      {dataUpdatedAt > 0 && (
        <p className="text-xs text-gray-400">
          Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()} - staleTime:
          10s
        </p>
      )}
    </div>
  )
}
