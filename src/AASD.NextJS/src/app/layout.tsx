import type { Metadata } from 'next'
import Link from 'next/link'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NavLinks } from '@/components/ui/NavLinks'
import { PageTransition } from '@/components/providers/PageTransition'
import QueryProvider from '@/components/providers/QueryProvider'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | AASD Chat',
    default: 'AASD Chat — Next.js Beauty Contest',
  },
  description: 'Beauty Contest: Next.js Chat App with SSR and SignalR real-time updates',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
          <header className="bg-surface border-b border-border shadow-sm sticky top-0 z-50">
            <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
              <Link href="/" className="text-xl font-bold text-primary hover:text-primary-hover transition-colors">
                AASD Chat
              </Link>
              <NavLinks />
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-text-muted font-mono">Next.js 15 · SSR</span>
                <ThemeToggle />
              </div>
            </nav>
          </header>
          <main className="container mx-auto px-4 py-8">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <footer className="border-t border-border mt-auto">
            <div className="container mx-auto px-4 h-12 flex items-center justify-center text-xs text-text-muted">
              AASD Beauty Contest — Next.js · React Server Components · SignalR
            </div>
          </footer>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
