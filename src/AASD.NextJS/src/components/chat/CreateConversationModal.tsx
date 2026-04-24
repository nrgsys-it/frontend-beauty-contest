'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { z } from 'zod'
import { getUsers, createConversation } from '@/app/actions/conversations'
import type { UserSummary } from '@/lib/types'

const TitleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(100, 'Title must be at most 100 characters')

interface Props {
  onCreated: (conversationId: string) => void
  onClose: () => void
}

export function CreateConversationModal({ onCreated, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [users, setUsers] = useState<UserSummary[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  // Inline Zod field validation
  const [titleError, setTitleError] = useState<string | null>(null)
  const [isPendingUsers, startUsersTransition] = useTransition()
  const [isPendingCreate, startCreateTransition] = useTransition()
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    startUsersTransition(async () => {
      try {
        const result = await getUsers()
        if (result) setUsers(result)
      } catch {
        // Non-fatal
      }
    })
    const timer = setTimeout(() => titleInputRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Validate title inline as the user types
  const handleTitleChange = (value: string) => {
    setTitle(value)
    const result = TitleSchema.safeParse(value)
    setTitleError(result.success ? null : (result.error.errors[0]?.message ?? null))
  }

  const toggleUser = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const trimmed = title.trim()
    const validation = TitleSchema.safeParse(trimmed)
    if (!validation.success) {
      setTitleError(validation.error.errors[0]?.message ?? 'Invalid title')
      return
    }
    setTitleError(null)

    startCreateTransition(async () => {
      const result = await createConversation(trimmed, selectedIds)
      if ('error' in result) {
        setServerError(result.error)
      } else {
        onCreated(result.conversation.id)
      }
    })
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-conv-title"
      >
        {/* Content */}
        <motion.div
          key="content"
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 id="create-conv-title" className="text-lg font-semibold text-gray-900">
              New Conversation
            </h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title input with inline Zod error */}
            <div>
              <label htmlFor="conv-title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="conv-title"
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter conversation title..."
                maxLength={100}
                autoComplete="off"
                aria-invalid={!!titleError}
                aria-describedby={titleError ? 'title-error' : undefined}
                className={`w-full px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 text-sm transition-colors ${
                  titleError
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                <AnimatePresence mode="wait">
                  {titleError ? (
                    <motion.p
                      key="error"
                      id="title-error"
                      role="alert"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-xs text-red-600"
                    >
                      {titleError}
                    </motion.p>
                  ) : (
                    <span key="empty" />
                  )}
                </AnimatePresence>
                <p className="text-xs text-gray-400 ml-auto">{title.length}/100</p>
              </div>
            </div>

            {/* Participants */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Participants (optional)
              </label>
              {isPendingUsers ? (
                <div className="text-sm text-gray-400 py-2">Loading users...</div>
              ) : (
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 divide-y divide-gray-100">
                  {users.length === 0 ? (
                    <div className="text-sm text-gray-400 text-center py-3">No users available</div>
                  ) : (
                    users.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-white cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(user.id)}
                          onChange={() => toggleUser(user.id)}
                          className="rounded accent-blue-600 flex-shrink-0"
                        />
                        <span className="text-sm text-gray-800 truncate">
                          {user.name && user.surname
                            ? `${user.name} ${user.surname}`
                            : (user.name ?? user.email ?? user.id)}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              )}
              {selectedIds.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  {selectedIds.length} participant{selectedIds.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Server error banner */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  key="server-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  role="alert"
                  className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                >
                  {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPendingCreate || !title.trim() || !!titleError}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isPendingCreate ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
