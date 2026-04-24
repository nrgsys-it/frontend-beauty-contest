'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '@/lib/store'
import type { ConversationParticipant } from '@/lib/types'

interface Props {
  participants: ConversationParticipant[]
}

/**
 * SenderSelector — lets the user pick which participant they are "writing as".
 * Sits above the message input. Useful for simulating multi-user conversations
 * from a single browser session.
 */
export function SenderSelector({ participants }: Props) {
  const activeSenderId = useChatStore((s) => s.activeSenderId)
  const setActiveSenderId = useChatStore((s) => s.setActiveSenderId)

  if (participants.length === 0) return null

  const effectiveId = activeSenderId ?? participants[0]?.id
  const activeSender = participants.find((p) => p.id === effectiveId) ?? participants[0]

  return (
    <div className="border-t border-border bg-surface-2 px-4 py-2 flex items-center gap-3 flex-wrap">
      <span className="text-xs text-text-muted font-medium shrink-0">
        Stai scrivendo come:
      </span>

      <div className="flex items-center gap-1.5 flex-wrap">
        {participants.map((p) => {
          const isActive = p.id === effectiveId
          return (
            <motion.button
              key={p.id}
              onClick={() => setActiveSenderId(p.id)}
              layout
              whileTap={{ scale: 0.94 }}
              className={`relative px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface border border-border text-text-muted hover:text-text hover:border-primary/40 hover:bg-surface'
              }`}
              aria-pressed={isActive}
              title={`${p.name} ${p.surname} <${p.email}>`}
            >
              {p.name} {p.surname}
              {/* Active indicator dot */}
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    key="dot"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-white"
                    aria-hidden
                  />
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>

      {/* Animated "writing as" label — slides in when sender changes */}
      <AnimatePresence mode="wait">
        {activeSender && (
          <motion.span
            key={activeSender.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="ml-auto text-xs text-text-muted italic truncate max-w-[160px]"
            aria-live="polite"
          >
            {activeSender.email}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
