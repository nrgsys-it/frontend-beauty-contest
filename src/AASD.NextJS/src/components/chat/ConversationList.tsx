'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import type { ConversationWithLastMessage } from '@/lib/types'
import { useChatStore } from '@/lib/store'
import { formatDistanceToNow } from '@/lib/dateUtils'
import { getConversations } from '@/app/actions/messages'

interface Props {
  conversations: ConversationWithLastMessage[]
  activeId: string | null
  onSelect: (id: string) => void
}

export default function ConversationList({ conversations: initialConversations, activeId, onSelect }: Props) {
  const unreadCounts = useChatStore((s) => s.unreadCounts)

  // React Query polls for new/updated conversations every 5 s.
  // The initial data (SSR-fetched by the page) is used until the first background refetch.
  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations(),
    initialData: initialConversations,
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
    staleTime: 4_000,
  })

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-sm text-text-muted">
        No conversations yet
      </div>
    )
  }

  return (
    <ul className="flex-1 overflow-y-auto divide-y divide-border">
      <AnimatePresence initial={false}>
        {conversations.map((conv) => {
          const last = conv.messages[0]
          const isActive = conv.id === activeId
          const unread = unreadCounts[conv.id] ?? 0
          return (
            <motion.li
              key={conv.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
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
                  <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                    {/* Unread badge with Framer Motion */}
                    <AnimatePresence>
                      {unread > 0 && (
                        <motion.span
                          key="badge"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold"
                        >
                          {unread > 99 ? '99+' : unread}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {last && (
                      <span className="text-xs text-text-muted">
                        {formatDistanceToNow(new Date(last.createdAt))}
                      </span>
                    )}
                  </div>
                </div>
                {last && (
                  <p className="text-xs text-text-muted truncate">
                    <span className="font-medium">{last.sender.name}:</span>{' '}
                    {last.content}
                  </p>
                )}
              </button>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}
