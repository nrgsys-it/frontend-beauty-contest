'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { getMessages, sendMessage as sendMessageAction } from '@/app/actions/messages'
import type { MessageWithSender, RealtimeStatus } from '@/lib/types'
import { ClientRenderBadge } from '@/components/ui/ClientRenderBadge'

// ─── Delivery status types & icons ───────────────────────────────────────────
type DeliveryStatus = 'sending' | 'sent' | 'delivered'

function ClockIcon() {
  return (
    <svg
      className="w-3 h-3 text-white/60"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

function SingleCheckIcon() {
  return (
    <svg
      className="w-3 h-3 text-white/70"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function DoubleCheckIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 text-accent"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 13l4 4L14 7" />
      <path d="M9 13l4 4L21 7" />
    </svg>
  )
}

function StatusIcon({ status }: { status: DeliveryStatus }) {
  if (status === 'sending') return <ClockIcon />
  if (status === 'sent') return <SingleCheckIcon />
  return <DoubleCheckIcon />
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  conversationId: string
  liveMessages: MessageWithSender[]
  senderId: string | null
  wsStatus: RealtimeStatus
}

export default function MessageArea({
  conversationId,
  liveMessages,
  senderId,
  wsStatus,
}: Props) {
  const t = useTranslations('chat')
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Optimistic message bubbles shown while the Server Action is in-flight
  const [optimisticMessages, setOptimisticMessages] = useState<MessageWithSender[]>([])

  // Delivery status map: message ID (tempId while sending, real ID after) → status
  const [deliveryStatus, setDeliveryStatus] = useState<Map<string, DeliveryStatus>>(new Map())

  // Load initial messages from DB (server action)
  useEffect(() => {
    getMessages(conversationId).then(setMessages)
  }, [conversationId])

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, liveMessages])

  // Upgrade 'sent' → 'delivered' when the same message arrives via SignalR
  useEffect(() => {
    if (liveMessages.length === 0) return
    setDeliveryStatus((prev) => {
      let changed = false
      const next = new Map(prev)
      for (const msg of liveMessages) {
        if (next.get(msg.id) === 'sent') {
          next.set(msg.id, 'delivered')
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [liveMessages])

  // Deduplicated merged view: DB messages + optimistic bubbles + live (SignalR)
  const allMessages = [...messages, ...optimisticMessages, ...liveMessages].filter(
    (message, index, source) =>
      source.findIndex((candidate) => candidate.id === message.id) === index,
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isPending) return

    const content = input.trim()
    setInput('')

    const tempId = crypto.randomUUID()
    const effectiveSenderId = senderId ?? '00000000-0000-0000-0000-000000000001'

    // 1. Show optimistic bubble immediately with 'sending' status (clock icon)
    const optimistic: MessageWithSender = {
      id: tempId,
      content,
      senderId: effectiveSenderId,
      conversationId,
      createdAt: new Date().toISOString(),
      sender: { id: effectiveSenderId, name: '', surname: '', email: '' },
    }
    setOptimisticMessages((prev) => [...prev, optimistic])
    setDeliveryStatus((prev) => new Map(prev).set(tempId, 'sending'))

    startTransition(async () => {
      const result = await sendMessageAction({
        content,
        conversationId,
        senderId: effectiveSenderId,
      })

      if (result.message) {
        const realId = result.message.id

        // 2. Remap tempId → realId and advance to 'sent' (single checkmark)
        setDeliveryStatus((prev) => {
          const next = new Map(prev)
          next.delete(tempId)
          next.set(realId, 'sent')
          return next
        })

        // Drop the optimistic bubble — the fresh DB fetch will include the real message
        setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId))

        const fresh = await getMessages(conversationId)
        setMessages(fresh)
      } else {
        // Send failed — discard the optimistic bubble and status entry silently
        setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId))
        setDeliveryStatus((prev) => {
          const next = new Map(prev)
          next.delete(tempId)
          return next
        })
      }
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2 border-b border-border flex items-center justify-end">
        <ClientRenderBadge label="Client Component · CSR" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {allMessages.length === 0 && (
          <div className="flex items-center justify-center h-full text-text-muted text-sm">
            {t('noMessages')}
          </div>
        )}
        {allMessages.map((msg, i) => {
          const isOwn = senderId ? msg.senderId === senderId : false
          const status = isOwn ? deliveryStatus.get(msg.id) : undefined
          return (
            <div
              key={msg.id ?? i}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isOwn
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-surface-2 text-text rounded-bl-sm'
                }`}
              >
                {!isOwn && (
                  <p className="text-xs font-semibold mb-1 text-text-muted">
                    {msg.sender.name} {msg.sender.surname}
                  </p>
                )}
                <p className="text-sm">{msg.content}</p>

                {/* Timestamp + delivery status on own messages */}
                <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                  <p
                    className={`text-xs ${
                      isOwn ? 'text-white/60' : 'text-text-muted'
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {isOwn && status !== undefined && (
                    <span className="inline-flex items-center">
                      <StatusIcon status={status} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            wsStatus === 'connected' ? t('typeMessage') : t('signalr.connecting')
          }
          disabled={isPending || !senderId}
          className="flex-1 bg-surface-2 border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isPending || !senderId}
          className="px-5 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-hover disabled:opacity-40 transition-colors"
        >
          {isPending ? t('sending') : t('send')}
        </button>
      </form>
    </div>
  )
}
