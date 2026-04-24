'use client'

import { useState } from 'react'

function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}) {
  const variants = {
    default: 'bg-gray-900 text-white',
    secondary: 'bg-gray-100 text-gray-800',
    destructive: 'bg-red-500 text-white',
    outline: 'border border-gray-300 text-gray-700',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  )
}

function Button({
  children,
  variant = 'default',
  onClick,
}: {
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'ghost'
  onClick?: () => void
}) {
  const variants = {
    default: 'bg-gray-900 text-white hover:bg-gray-800',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${variants[variant]}`}
    >
      {children}
    </button>
  )
}

export default function ShadcnDemo() {
  const [count, setCount] = useState(0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="p-4 rounded-lg border border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">shadcn/ui Card</h3>
          <Badge>New</Badge>
        </div>

        <p className="text-sm text-gray-500">
          Components are copy-pasted into your project (no npm install). Full
          ownership, fully customizable.
        </p>

        <div className="flex gap-2">
          <Badge variant="secondary">RSC-first</Badge>
          <Badge variant="outline">Radix UI</Badge>
          <Badge variant="destructive">v2</Badge>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={() => setCount((current) => current + 1)}>
            Clicked {count}x
          </Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        shadcn/ui is not a library - it is a collection of reusable components
        you own. 78k star on GitHub.
      </p>
    </div>
  )
}
