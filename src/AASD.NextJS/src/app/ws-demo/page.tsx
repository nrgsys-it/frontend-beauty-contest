import type { Metadata } from 'next'
import WsDemo from '@/components/ws/WsDemo'

export const metadata: Metadata = { title: 'WebSocket Demo' }

export default function WsDemoPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">WebSocket Demo</h1>
        <p className="text-gray-500">
          Native WebSocket (no SignalR, no SSE). Open this page in two browser tabs to see real-time messaging.
        </p>
      </div>
      <WsDemo />
    </div>
  )
}
