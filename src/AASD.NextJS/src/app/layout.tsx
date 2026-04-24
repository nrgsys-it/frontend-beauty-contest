import type { Metadata } from 'next'
import Link from 'next/link'
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
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
              AASD Chat
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link href="/chat" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Chat
              </Link>
              <Link href="/ssr-demo" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                SSR Demo
              </Link>
              <Link href="/ws-demo" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                SignalR Demo
              </Link>
              <Link href="/libs-demo" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Libs
              </Link>
              <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Settings
              </Link>
            </div>
            <div className="text-xs text-gray-400 font-mono">Next.js 15 · SSR</div>
          </nav>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 mt-auto">
          <div className="container mx-auto px-4 h-12 flex items-center justify-center text-xs text-gray-400">
            AASD Beauty Contest — Next.js · React Server Components · SignalR
          </div>
        </footer>
      </body>
    </html>
  )
}
