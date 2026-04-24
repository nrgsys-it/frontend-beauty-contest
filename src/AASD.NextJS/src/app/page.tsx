import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Home',
}

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">AASD Chat</h1>
        <p className="text-xl text-gray-500">Next.js 15 · App Router · SSR · Real-time WebSocket</p>
        <p className="text-sm text-gray-400 mt-2">Frontend Beauty Contest — React/Next.js branch</p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/chat"
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          Open Chat →
        </Link>
        <Link
          href="/settings"
          className="px-8 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Settings
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-6 mt-8 text-center">
        {[
          { label: 'SSR', desc: 'React Server Components', icon: '⚡' },
          { label: 'Real-time', desc: 'Native WebSocket', icon: '🔴' },
          { label: 'Type-safe', desc: 'TypeScript + Zod', icon: '🛡️' },
        ].map((f) => (
          <div key={f.label} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-3xl mb-2">{f.icon}</div>
            <div className="font-semibold text-gray-800">{f.label}</div>
            <div className="text-xs text-gray-500 mt-1">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
