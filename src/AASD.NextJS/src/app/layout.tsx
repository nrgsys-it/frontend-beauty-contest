import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher'
import { NavLinks } from '@/components/ui/NavLinks'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

export const metadata: Metadata = {
  title: {
    template: '%s | AASD Chat',
    default: 'AASD Chat — Next.js Beauty Contest',
  },
  description: 'Beauty Contest: Next.js Chat App with SSR and SignalR real-time updates',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-surface text-text" suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <header className="bg-surface border-b border-border shadow-sm sticky top-0 z-50">
              <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold text-primary hover:text-primary-hover transition-colors">
                  AASD Chat
                </Link>
                <NavLinks />
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-text-muted font-mono">Next.js 15 · SSR</span>
                  <LocaleSwitcher />
                  <ThemeToggle />
                </div>
              </nav>
            </header>
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="border-t border-border mt-auto">
              <div className="container mx-auto px-4 h-12 flex items-center justify-center text-xs text-text-muted">
                AASD Beauty Contest — Next.js · React Server Components · SignalR
              </div>
            </footer>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
