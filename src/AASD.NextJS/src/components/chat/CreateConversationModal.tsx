'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { getUsers, createConversation } from '@/app/actions/conversations'
import type { UserSummary } from '@/lib/types'

interface Props {
  onCreated: (conversationId: string) => void
  onClose: () => void
}

export function CreateConversationModal({ onCreated, onClose }: Props) {
  const t = useTranslations('chat')
  const [title, setTitle] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [users, setUsers] = useState<UserSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPendingUsers, startUsersTransition] = useTransition()
  const [isPendingCreate, startCreateTransition] = useTransition()
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Load users when modal opens
  useEffect(() => {
    startUsersTransition(async () => {
      try {
        const result = await getUsers()
        if (result) setUsers(result)
      } catch {
        // Non-fatal: participants are optional
      }
    })
    // Defer focus to allow the element to mount
    const timer = setTimeout(() => titleInputRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggleUser = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmed = title.trim()
    if (!trimmed) {
      setError(t('createModal.titleRequired'))
      return
    }
    if (trimmed.length > 100) {
      setError(t('createModal.titleRequired'))
      return
    }

    startCreateTransition(async () => {
      const result = await createConversation(trimmed, selectedIds)
      if ('error' in result) {
        setError(result.error)
      } else {
        onCreated(result.conversation.id)
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-conv-title"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            id="create-conv-title"
            className="text-lg font-semibold text-gray-900"
          >
            {t('createModal.title')}
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
          {/* Title input */}
          <div>
            <label
              htmlFor="conv-title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
            {t('createModal.titleLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              id="conv-title"
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('createModal.titlePlaceholder')}
              maxLength={100}
              autoComplete="off"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {title.length}/100
            </p>
          </div>

          {/* Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('createModal.participants')}
            </label>
            {isPendingUsers ? (
              <div className="text-sm text-gray-400 py-2">{t('createModal.loadingUsers')}</div>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 divide-y divide-gray-100">
                {users.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-3">
                    {t('createModal.noUsers')}
                  </div>
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
                {selectedIds.length} participant
                {selectedIds.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 transition-colors"
            >
              {t('createModal.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPendingCreate || !title.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isPendingCreate ? t('createModal.creating') : t('createModal.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
