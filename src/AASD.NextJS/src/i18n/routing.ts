import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['en', 'it'],
  defaultLocale: 'en',
  // 'as-needed' = default locale (en) keeps no prefix (/),
  // non-default locales get prefix (/it/...).
  // This avoids redirecting / → /en when the [locale] route segment doesn't exist.
  localePrefix: 'as-needed'
})

// Locale-aware navigation hooks — use these instead of next/navigation in client components.
// useRouter().replace(pathname, { locale }) performs a locale switch without a full reload.
// usePathname() returns the pathname WITHOUT the locale prefix.
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
