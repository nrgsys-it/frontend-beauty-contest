'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { getMessages, sendMessage as sendMessageAction } from '@/app/actions/messages'
import type { MessageWithSender, RealtimeStatus } from '@/lib/types'

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
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load initial messages from DB (server action)
  useEffect(() => {
    getMessages(conversationId).then(setMessages)
  }, [conversationId])

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, liveMessages])

  const allMessages = [...messages, ...liveMessages].filter(
    (message, index, source) =>
      source.findIndex((candidate) => candidate.id === message.id) === index,
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isPending) return

    const content = input.trim()
    setInput('')

    startTransition(async () => {
      const result = await sendMessageAction({
        content,
        conversationId,
        senderId: senderId ?? '00000000-0000-0000-0000-000000000001',
      })
      if (result.message) {
        const fresh = await getMessages(conversationId)
        setMessages(fresh)
      }
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {allMessages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No messages yet - say hello! 👋
          </div>
        )}
        {allMessages.map((msg, i) => {
          const isOwn = senderId ? msg.senderId === senderId : false
          return (
            <div
              key={msg.id ?? i}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isOwn
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {!isOwn && (
                  <p className="text-xs font-semibold mb-1 text-gray-500">
                    {msg.sender.name} {msg.sender.surname}
                  </p>
                )}
                <p className="text-sm">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    isOwn ? 'text-blue-200' : 'text-gray-400'
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            wsStatus === 'connected' ? 'Type a message...' : 'Connecting...'
          }
          disabled={isPending || !senderId}
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isPending || !senderId}
          className="px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {isPending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
