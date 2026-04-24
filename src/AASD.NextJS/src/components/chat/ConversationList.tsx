'use client'

import type { ConversationWithLastMessage } from '@/lib/types'
import { formatDistanceToNow } from '@/lib/dateUtils'

interface Props {
  conversations: ConversationWithLastMessage[]
  activeId: string | null
  onSelect: (id: string) => void
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
}: Props) {
  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-sm text-gray-400">
        No conversations yet
      </div>
    )
  }
  return (
    <ul className="flex-1 overflow-y-auto divide-y divide-gray-50">
      {conversations.map((conv) => {
        const last = conv.messages[0]
        const isActive = conv.id === activeId
        return (
          <li key={conv.id}>
            <button
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                isActive ? 'bg-blue-50 border-r-2 border-blue-600' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium truncate ${
                    isActive ? 'text-blue-700' : 'text-gray-800'
                  }`}
                >
                  {conv.title}
                </span>
                {last && (
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                    {formatDistanceToNow(new Date(last.createdAt))}
                  </span>
                )}
              </div>
              {last && (
                <p className="text-xs text-gray-500 truncate">
                  <span className="font-medium">{last.sender.name}:</span>{' '}
                  {last.content}
                </p>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
