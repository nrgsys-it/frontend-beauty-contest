'use client'

import type { RealtimeStatus } from '@/lib/types'

const config: Record<RealtimeStatus, { color: string; label: string }> = {
  connecting: { color: 'bg-yellow-400', label: 'Connecting' },
  connected: { color: 'bg-green-500', label: 'Live' },
  disconnected: { color: 'bg-gray-400', label: 'Offline' },
  error: { color: 'bg-red-500', label: 'Error' },
}

export default function WsStatusBadge({ status }: { status: RealtimeStatus }) {
  const { color, label } = config[status] ?? config.disconnected
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-500">
      <span
        className={`h-2 w-2 rounded-full ${color} ${
          status === 'connected' ? 'animate-pulse' : ''
        }`}
      />
      {label}
    </span>
  )
}
