'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const locales = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'it', label: 'IT', flag: '🇮🇹' },
]

export function LocaleSwitcher() {
  const pathname = usePathname()

  // Determine current locale from path
  const currentLocale = locales.find(l => pathname.startsWith(`/${l.code}`))?.code ?? 'en'

  // Strip current locale prefix to get base path
  const basePath = currentLocale
    ? pathname.replace(new RegExp(`^/${currentLocale}`), '') || '/'
    : pathname

  return (
    <div className="flex items-center gap-1">
      {locales.map(locale => {
        const isActive = locale.code === currentLocale
        return (
          <Link
            key={locale.code}
            href={`/${locale.code}${basePath}`}
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
