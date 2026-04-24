'use client'

import Link from 'next/link'

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Chat', href: '/chat' },
  { label: 'Evaluation', href: '/ssr-demo' },
  { label: 'WebSocket Demo', href: '/ws-demo' },
  { label: 'Libraries', href: '/libs-demo' },
  { label: 'Settings', href: '/settings' },
]

export function NavLinks() {
  return (
    <div className="flex items-center gap-6">
      {NAV_ITEMS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          className="text-sm text-text-muted hover:text-primary transition-colors"
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
