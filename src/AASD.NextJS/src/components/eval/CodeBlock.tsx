'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CodeBlockProps {
  filename: string
  language: string
  code: string
}

export function CodeBlock({ filename, language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available (e.g. HTTP context)
    }
  }

  return (
    <div className="bg-gray-950 rounded-xl overflow-hidden text-sm">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-mono text-xs">{filename}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-400 uppercase tracking-wide">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="relative flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="copied"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="text-emerald-400"
              >
                ✓ Copied!
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
              >
                Copy
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Code */}
      <pre className="font-mono text-sm text-green-400 p-4 overflow-x-auto whitespace-pre leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}
