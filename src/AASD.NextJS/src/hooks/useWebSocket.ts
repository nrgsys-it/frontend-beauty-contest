'use client'

import { useEffect, useState } from 'react'
import {
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  LogLevel,
} from '@microsoft/signalr'
import { getBackendHubUrl } from '@/lib/backend'
import type { RealtimeStatus, RealtimeStatusEntry, WsMessageType, MessageWithSender } from '@/lib/types'

const DEFAULT_CLIENT_USER_ID = '00000000-0000-0000-0000-000000000001'

interface UseWebSocketOptions {
  conversationId: string | null
  userId?: string | null
  onMessage?: (msg: WsMessageType) => void
}

export function useWebSocket({ conversationId, userId, onMessage }: UseWebSocketOptions) {
  const [status, setStatus] = useState<RealtimeStatus>('disconnected')
  const [statusHistory, setStatusHistory] = useState<RealtimeStatusEntry[]>([])

  const updateStatus = (next: RealtimeStatus) => {
    setStatus(next)
    setStatusHistory((prev) =>
      [...prev, { status: next, timestamp: Date.now() }].slice(-10)
    )
  }

  useEffect(() => {
    if (!conversationId) return

    const senderId = userId ?? DEFAULT_CLIENT_USER_ID
    const connection = new HubConnectionBuilder()
      .withUrl(getBackendHubUrl(), {
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
        withCredentials: false,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Warning)
      .build()

    updateStatus('connecting')

    connection.on('ReceiveMessage', (message: MessageWithSender) => {
      onMessage?.({
        type: 'chat',
        payload: {
          conversationId: message.conversationId,
          message,
        },
      })
    })

    connection.onreconnecting(() => {
      updateStatus('connecting')
    })

    connection.onreconnected(async () => {
      updateStatus('connected')
      try {
        await connection.invoke('JoinConversation', conversationId, senderId)
      } catch {
        updateStatus('error')
      }
    })

    connection.onclose(() => {
      updateStatus('disconnected')
    })

    void (async () => {
      try {
        await connection.start()
        await connection.invoke('JoinConversation', conversationId, senderId)
        updateStatus('connected')
      } catch {
        updateStatus('error')
      }
    })()

    return () => {
      void (async () => {
        try {
          if (connection.state === HubConnectionState.Connected) {
            await connection.invoke('LeaveConversation', conversationId)
          }
          await connection.stop()
        } finally {
        }
      })()
    }
  }, [conversationId, onMessage, userId])

  return { status, statusHistory }
}
