'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

const messages = [
  { id: 1, text: 'Hello!', from: 'Alice' },
  { id: 2, text: 'Hi there! How are you?', from: 'You' },
  { id: 3, text: 'Doing great, thanks!', from: 'Alice' },
]

export default function MotionDemo() {
  const [visible, setVisible] = useState<number[]>([])
  const [running, setRunning] = useState(false)

  const runAnimation = async () => {
    setVisible([])
    setRunning(true)

    for (let i = 0; i < messages.length; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 600))
      setVisible((prev) => [...prev, messages[i].id])
    }

    setRunning(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="space-y-2 min-h-[120px]">
        <AnimatePresence>
          {messages
            .filter((message) => visible.includes(message.id))
            .map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`flex ${
                  message.from === 'You' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl text-sm max-w-xs ${
                    message.from === 'You'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-xs opacity-60 mb-0.5">{message.from}</p>
                  {message.text}
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      <button
        onClick={runAnimation}
        disabled={running}
        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {running ? 'Playing...' : 'Play message animation'}
      </button>

      <p className="text-xs text-gray-400">
        Uses <code>AnimatePresence</code> and <code>motion.div</code> with spring
        physics. Note: requires &apos;use client&apos; and cannot be used in RSC.
      </p>
    </div>
  )
}
