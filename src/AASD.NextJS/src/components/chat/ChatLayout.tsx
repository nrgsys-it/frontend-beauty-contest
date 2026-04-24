'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type {
  ConversationWithLastMessage,
  MessageWithSender,
  WsMessageType,
} from '@/lib/types'
import { useWebSocket } from '@/hooks/useWebSocket'
import ConversationList from './ConversationList'
import MessageArea from './MessageArea'
import WsStatusBadge from './WsStatusBadge'

interface ChatLayoutProps {
  conversations: ConversationWithLastMessage[]
  activeConversationId: string | null
}

export default function ChatLayout({
  conversations,
  activeConversationId,
}: ChatLayoutProps) {
  const router = useRouter()
  const [activeId, setActiveId] = useState<string | null>(activeConversationId)
  const [liveMessages, setLiveMessages] = useState<MessageWithSender[]>([])

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeId,
  )
  const activeUserId = activeConversation?.participants[0]?.id ?? null

  const handleWsMessage = useCallback((msg: WsMessageType) => {
    if (msg.type === 'chat') {
      setLiveMessages((prev) => {
        if (prev.some((message) => message.id === msg.payload.message.id)) {
          return prev
        }

        return [...prev, msg.payload.message]
      })
    }
  }, [])

  const { status } = useWebSocket({
    conversationId: activeId,
    userId: activeUserId,
    onMessage: handleWsMessage,
  })

  const handleSelectConversation = (id: string) => {
    setActiveId(id)
    setLiveMessages([])
    router.push(`/chat?conv=${id}`, { scroll: false })
  }

  return (
    <>
      {/* Sidebar */}
      <aside className="w-72 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Conversations</h2>
          <WsStatusBadge status={status} />
        </div>
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelectConversation}
        />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {activeId ? (
          <MessageArea
            conversationId={activeId}
            liveMessages={liveMessages}
            senderId={activeUserId}
            wsStatus={status}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm mt-1">
                Choose from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
