'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

const NAV_ITEMS = [
  { key: 'home' as const, href: '/' },
  { key: 'chat' as const, href: '/chat' },
  { key: 'ssrDemo' as const, href: '/ssr-demo' },
  { key: 'wsDemo' as const, href: '/ws-demo' },
  { key: 'libsDemo' as const, href: '/libs-demo' },
  { key: 'settings' as const, href: '/settings' },
]

export function NavLinks() {
  const t = useTranslations('nav')

  return (
    <div className="flex items-center gap-6">
      {NAV_ITEMS.map(({ key, href }) => (
        <Link
          key={key}
          href={href}
          className="text-sm text-text-muted hover:text-primary transition-colors"
        >
          {t(key)}
        </Link>
      ))}
    </div>
  )
}
