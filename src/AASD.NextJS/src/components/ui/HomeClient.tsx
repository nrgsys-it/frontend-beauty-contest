'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const FEATURES = [
  { label: 'SSR', desc: 'React Server Components', icon: '⚡' },
  { label: 'Real-time', desc: 'SignalR over shared backend', icon: '🔴' },
  { label: 'Type-safe', desc: 'TypeScript + Zod', icon: '🛡️' },
]

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

export function HomeClient() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h1 className="text-5xl font-bold text-text mb-4">AASD Chat</h1>
        <p className="text-xl text-text-muted">Next.js 15 · App Router · SSR · Real-time SignalR</p>
        <p className="text-sm text-text-muted mt-2">Frontend Beauty Contest — React/Next.js branch</p>
      </motion.div>

      <motion.div
        className="flex gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Link
          href="/chat"
          className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors shadow-sm"
        >
          Open Chat →
        </Link>
        <Link
          href="/settings"
          className="px-8 py-3 bg-surface text-text border border-border rounded-lg font-medium hover:bg-surface-2 transition-colors"
        >
          Settings
        </Link>
      </motion.div>

      <motion.div
        className="grid grid-cols-3 gap-6 mt-8 text-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {FEATURES.map((f) => (
          <motion.div
            key={f.label}
            variants={item}
            className="bg-surface rounded-xl p-6 border border-border shadow-sm"
            whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="text-3xl mb-2">{f.icon}</div>
            <div className="font-semibold text-text">{f.label}</div>
            <div className="text-xs text-text-muted mt-1">{f.desc}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
