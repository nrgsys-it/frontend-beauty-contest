'use client'

// Client variant — shows a blue badge with the hydration timestamp.
// The badge is intentionally empty-looking until the useEffect fires,
// which proves the initial HTML arrived from the server without this timestamp.

import { useState, useEffect } from 'react'

interface ClientBadgeProps {
  label?: string
}

export function ClientRenderBadge({ label = 'Client Component · CSR' }: ClientBadgeProps) {
  const [hydratedAt, setHydratedAt] = useState<string | null>(null)

  useEffect(() => {
    setHydratedAt(new Date().toISOString())
  }, [])

  if (!hydratedAt) {
    // Before hydration: show placeholder to avoid layout shift
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 opacity-50">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        {label} · hydrating...
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
      title={`Hydrated on client at ${hydratedAt}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
      {label}
      <span className="text-blue-600 dark:text-blue-500 font-mono text-[10px] ml-1">
        {hydratedAt.slice(11, 23)}
      </span>
    </span>
  )
}
