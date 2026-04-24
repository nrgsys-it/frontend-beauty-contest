'use client'

import { useEffect, useState } from 'react'
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'
import { getBackendHubUrl } from '@/lib/backend'
import type { RealtimeStatus, WsMessageType, MessageWithSender } from '@/lib/types'

const DEFAULT_CLIENT_USER_ID = '00000000-0000-0000-0000-000000000001'

interface UseWebSocketOptions {
  conversationId: string | null
  userId?: string | null
  onMessage?: (msg: WsMessageType) => void
}

export function useWebSocket({ conversationId, userId, onMessage }: UseWebSocketOptions) {
  const [status, setStatus] = useState<RealtimeStatus>('disconnected')

  useEffect(() => {
    if (!conversationId) return

    const senderId = userId ?? DEFAULT_CLIENT_USER_ID
    const connection = new HubConnectionBuilder()
      .withUrl(getBackendHubUrl())
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Warning)
      .build()

    setStatus('connecting')

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
      setStatus('connecting')
    })

    connection.onreconnected(async () => {
      setStatus('connected')
      try {
        await connection.invoke('JoinConversation', conversationId, senderId)
      } catch {
        setStatus('error')
      }
    })

    connection.onclose(() => {
      setStatus('disconnected')
    })

    void (async () => {
      try {
        await connection.start()
        await connection.invoke('JoinConversation', conversationId, senderId)
        setStatus('connected')
      } catch {
        setStatus('error')
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

  return { status }
}
