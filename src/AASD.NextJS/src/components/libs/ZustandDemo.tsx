'use client'

import { useChatStore } from '@/lib/store'

export default function ZustandDemo() {
  const { wsStatus, activeConversationId, setWsStatus, setActiveConversation } =
    useChatStore()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-500">wsStatus:</span>
        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-blue-700">
          {wsStatus}
        </span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-500">activeConversationId:</span>
        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-blue-700">
          {activeConversationId ?? 'null'}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        {(['connecting', 'connected', 'disconnected', 'error'] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => setWsStatus(status)}
              className="px-3 py-1 text-xs rounded-full border border-gray-300 hover:bg-gray-50"
            >
              Set {status}
            </button>
          )
        )}
        <button
          onClick={() => setActiveConversation(crypto.randomUUID())}
          className="px-3 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700"
        >
          Random conv
        </button>
      </div>
      <p className="text-xs text-gray-400">
        State managed by Zustand (with devtools middleware). Open Redux DevTools
        to inspect.
      </p>
    </div>
  )
}
