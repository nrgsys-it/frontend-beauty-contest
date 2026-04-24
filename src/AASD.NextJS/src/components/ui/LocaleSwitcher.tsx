'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const locales = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'it', label: 'IT', flag: '🇮🇹' },
]

export function LocaleSwitcher() {
  const pathname = usePathname()

  // With localePrefix='as-needed': default locale (en) has no prefix.
  // Non-default locales (/it/...) have a prefix.
  const currentLocale = locales.find(l => l.code !== 'en' && pathname.startsWith(`/${l.code}`))?.code ?? 'en'

  // Strip non-default locale prefix to get base path
  const basePath = currentLocale !== 'en'
    ? pathname.replace(new RegExp(`^/${currentLocale}`), '') || '/'
    : pathname

  return (
    <div className="flex items-center gap-1">
      {locales.map(locale => {
        const isActive = locale.code === currentLocale
        // en → no prefix (/chat), it → prefixed (/it/chat)
        const href = locale.code === 'en' ? basePath : `/${locale.code}${basePath}`
        return (
          <Link
            key={locale.code}
            href={href}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text hover:bg-surface-2'
            }`}
            title={locale.code === 'en' ? 'English' : 'Italiano'}
          >
            {locale.flag} {locale.label}
          </Link>
        )
      })}
    </div>
  )
}
