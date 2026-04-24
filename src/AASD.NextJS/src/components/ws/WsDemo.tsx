'use client'

import { useState, useCallback, useTransition } from 'react'
import { sendMessage } from '@/app/actions/messages'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { WsMessageType } from '@/lib/types'

interface LogEntry {
  time: string
  direction: 'in' | 'out' | 'sys'
  content: string
}

interface WsDemoProps {
  conversationId: string
  senderId: string
  title: string
}

export default function WsDemo({ conversationId, senderId, title }: WsDemoProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()

  const addLog = useCallback((direction: LogEntry['direction'], content: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs((prev) => [...prev.slice(-49), { time, direction, content }])
  }, [])

  const handleMessage = useCallback((msg: WsMessageType) => {
    addLog('in', JSON.stringify(msg))
  }, [addLog])

  const { status } = useWebSocket({
    conversationId,
    userId: senderId,
    onMessage: handleMessage,
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isPending) return

    const content = input.trim()
    setInput('')

    startTransition(async () => {
      const result = await sendMessage({
        content,
        conversationId,
        senderId,
      })

      if (result.message) {
        const envelope: WsMessageType = {
          type: 'chat',
          payload: {
            conversationId,
            message: result.message,
          },
        }
        addLog('out', JSON.stringify(envelope))
      } else if (result.error) {
        addLog('sys', typeof result.error === 'string' ? result.error : 'Unable to send')
      }
    })
  }

  const statusColors: Record<string, string> = {
    connected: 'text-green-600 bg-green-50',
    connecting: 'text-yellow-600 bg-yellow-50',
    disconnected: 'text-gray-500 bg-gray-50',
    error: 'text-red-600 bg-red-50',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`px-4 py-2 flex items-center justify-between text-sm font-medium ${statusColors[status] || statusColors.disconnected}`}>
        <span>SignalR: {status.toUpperCase()}</span>
        <span className="font-mono text-xs">{title}</span>
      </div>

      <div className="h-80 overflow-y-auto bg-gray-900 p-4 font-mono text-xs space-y-1">
        {logs.length === 0 && (
          <p className="text-gray-500">Waiting for messages... Open this page in another tab!</p>
        )}
        {logs.map((l, i) => (
          <div
            key={i}
            className={`flex gap-2 ${
              l.direction === 'in' ? 'text-green-400' : l.direction === 'out' ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            <span className="text-gray-600 flex-shrink-0">{l.time}</span>
            <span className="flex-shrink-0">{l.direction === 'in' ? '<-' : l.direction === 'out' ? '->' : '.'}</span>
            <span className="break-all">{l.content}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 p-4 border-t border-gray-200">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message through backend + SignalR..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={status !== 'connected' || isPending}
        />
        <button
          type="submit"
          disabled={status !== 'connected' || !input.trim() || isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
        >
          {isPending ? '...' : 'Send'}
        </button>
      </form>

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
        Open this page in a second browser tab. Messages are persisted through the shared backend and delivered in real-time via SignalR.
      </div>
    </div>
  )
}
