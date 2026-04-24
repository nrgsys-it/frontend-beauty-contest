import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'it'],
  defaultLocale: 'en',
  // 'as-needed' = default locale (en) keeps no prefix (/),
  // non-default locales get prefix (/it/...).
  // This avoids redirecting / → /en when the [locale] route segment doesn't exist.
  localePrefix: 'as-needed'
})
