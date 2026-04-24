'use client'

import { useState } from 'react'
import { ClientRenderBadge } from '@/components/ui/ClientRenderBadge'

interface FlightPayloadViewerProps {
  data: unknown
  title?: string
}

export function FlightPayloadViewer({ data, title = 'React Flight Payload (RSC Data)' }: FlightPayloadViewerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-8 border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-2 hover:bg-surface transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <ClientRenderBadge label="Client Component" />
          <span className="font-mono text-sm font-medium text-text">{title}</span>
        </div>
        <span className="text-text-muted text-sm">{open ? '▲ Hide' : '▼ Show'}</span>
      </button>
      {open && (
        <div className="bg-gray-950 dark:bg-black p-4 overflow-x-auto">
          <div className="text-xs text-gray-400 mb-2 font-mono">
            {`// This data was fetched server-side (RSC) and passed as props to this client component`}
          </div>
          <pre className="text-green-400 font-mono text-xs whitespace-pre-wrap leading-relaxed">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
