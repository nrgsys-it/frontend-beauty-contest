'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { WsMessageType } from '@/lib/types'

type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseWebSocketOptions {
  conversationId: string | null
  onMessage?: (msg: WsMessageType) => void
}

export function useWebSocket({ conversationId, onMessage }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef(0)
  const [status, setStatus] = useState<WsStatus>('disconnected')

  const connect = useCallback(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002'
    const ws = new WebSocket(`${url}/chat`)
    wsRef.current = ws
    setStatus('connecting')

    ws.onopen = () => {
      setStatus('connected')
      reconnectAttempts.current = 0
      if (conversationId) {
        ws.send(JSON.stringify({ type: 'join', payload: { conversationId } }))
      }
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsMessageType
        onMessage?.(msg)
      } catch (e) {
        console.error('[useWebSocket] Parse error:', e)
      }
    }

    ws.onclose = () => {
      setStatus('disconnected')
      // Exponential backoff: 1s, 2s, 4s, 8s, max 16s
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 16000)
      reconnectAttempts.current++
      console.log(`[useWebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`)
      reconnectTimerRef.current = setTimeout(connect, delay)
    }

    ws.onerror = () => {
      setStatus('error')
    }
  }, [conversationId, onMessage])

  useEffect(() => {
    if (!conversationId) return
    connect()
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
    }
  }, [conversationId, connect])

  const sendMessage = useCallback((msg: WsMessageType) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  return { status, sendMessage }
}
