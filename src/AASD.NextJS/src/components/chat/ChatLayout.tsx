'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type {
  ConversationWithLastMessage,
  MessageWithSender,
  WsMessageType,
} from '@/lib/types'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useChatStore } from '@/lib/store'
import ConversationList from './ConversationList'
import MessageArea from './MessageArea'
import { SignalRStatusPanel } from './SignalRStatusPanel'
import { CreateConversationModal } from './CreateConversationModal'
import { ClientRenderBadge } from '@/components/ui/ClientRenderBadge'

interface ChatLayoutProps {
  conversations: ConversationWithLastMessage[]
  activeConversationId: string | null
}

export default function ChatLayout({
  conversations,
  activeConversationId,
}: ChatLayoutProps) {
  const t = useTranslations('chat')
  const router = useRouter()
  const [activeId, setActiveId] = useState<string | null>(activeConversationId)
  const [liveMessages, setLiveMessages] = useState<MessageWithSender[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)

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

  const { status, statusHistory } = useWebSocket({
    conversationId: activeId,
    userId: activeUserId,
    onMessage: handleWsMessage,
  })

  const setWsStatus = useChatStore((s) => s.setWsStatus)
  const setWsStatusHistory = useChatStore((s) => s.setWsStatusHistory)

  useEffect(() => {
    setWsStatus(status)
  }, [status, setWsStatus])

  useEffect(() => {
    setWsStatusHistory(statusHistory)
  }, [statusHistory, setWsStatusHistory])

  const handleSelectConversation = (id: string) => {
    setActiveId(id)
    setLiveMessages([])
    router.push(`/chat?conv=${id}`, { scroll: false })
  }

  const handleConversationCreated = (id: string) => {
    setShowCreateModal(false)
    router.refresh()
    handleSelectConversation(id)
  }

  return (
    <>
      {/* Sidebar */}
      <aside className="w-72 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-text">{t('conversations')}</h2>
            <ClientRenderBadge label="Client Component · CSR" />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            aria-label={t('newConversation')}
            title={t('newConversation')}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover transition-colors text-lg leading-none font-medium"
          >
            +
          </button>
        </div>
        <SignalRStatusPanel />
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
          <div className="flex-1 flex items-center justify-center text-text-muted">
            <div className="text-center">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-lg font-medium">{t('selectConversation')}</p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation modal */}
      {showCreateModal && (
        <CreateConversationModal
          onCreated={handleConversationCreated}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </>
  )
}
