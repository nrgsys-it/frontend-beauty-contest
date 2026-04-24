'use client'

import { useTransition } from 'react'

const locales = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'it', label: 'IT', flag: '🇮🇹' },
]

export function LocaleSwitcher() {
  const [, startTransition] = useTransition()

  // Determine the current locale: next-intl middleware sets the locale on the request.
  // usePathname() from @/i18n/routing returns the pathname WITHOUT the locale prefix,
  // so we detect the active locale by checking the raw window location (client-only).
  // A simpler approach: read the <html lang> attribute that next-intl sets at runtime.
  const getCurrentLocale = () => {
    if (typeof document === 'undefined') return 'en'
    return document.documentElement.lang ?? 'en'
  }

  const handleSwitch = (locale: string) => {
    // next-intl's router.replace with { locale } would navigate to /it/... which 404s
    // because there is no [locale] route segment in src/app/.
    // Instead, set the NEXT_LOCALE cookie (read by next-intl middleware) and reload.
    startTransition(() => {
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`
      window.location.reload()
    })
  }

  const currentLocale = getCurrentLocale()

  return (
    <div className="flex items-center gap-1">
      {locales.map(locale => {
        const isActive = locale.code === currentLocale
        return (
          <button
            key={locale.code}
            onClick={() => handleSwitch(locale.code)}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text hover:bg-surface-2'
            }`}
            title={locale.code === 'en' ? 'English' : 'Italiano'}
            aria-pressed={isActive}
          >
            {locale.flag} {locale.label}
          </button>
        )
      })}
    </div>
  )
}
