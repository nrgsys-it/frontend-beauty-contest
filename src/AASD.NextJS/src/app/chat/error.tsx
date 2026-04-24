'use client'
import { useEffect } from 'react'

export default function ChatError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-bold text-red-600">Chat Error</h2>
      <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white rounded">Retry</button>
    </div>
  )
}
