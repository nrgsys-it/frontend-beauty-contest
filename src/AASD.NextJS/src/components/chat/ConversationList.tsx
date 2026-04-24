'use client'

import { useTranslations } from 'next-intl'
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
  const t = useTranslations('chat')
  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-sm text-text-muted">
        {t('noConversations')}
      </div>
    )
  }
  return (
    <ul className="flex-1 overflow-y-auto divide-y divide-border">
      {conversations.map((conv) => {
        const last = conv.messages[0]
        const isActive = conv.id === activeId
        return (
          <li key={conv.id}>
            <button
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left px-4 py-3 hover:bg-surface-2 transition-colors ${
                isActive ? 'bg-primary/10 border-l-2 border-primary' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium truncate ${
                    isActive ? 'text-primary' : 'text-text'
                  }`}
                >
                  {conv.title}
                </span>
                {last && (
                  <span className="text-xs text-text-muted ml-2 flex-shrink-0">
                    {formatDistanceToNow(new Date(last.createdAt))}
                  </span>
                )}
              </div>
              {last && (
                <p className="text-xs text-text-muted truncate">
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
