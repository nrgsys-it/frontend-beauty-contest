'use client'

import { useState } from 'react'
import { z } from 'zod'

const MessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Max 500 characters'),
  username: z
    .string()
    .min(2, 'Min 2 characters')
    .max(30, 'Max 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores'),
})

type FormErrors = Partial<Record<keyof z.infer<typeof MessageSchema>, string[]>>

export default function ZodDemo() {
  const [content, setContent] = useState('')
  const [username, setUsername] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitted(null)

    const result = MessageSchema.safeParse({ content, username })
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors)
      return
    }

    setErrors({})
    setSubmitted(JSON.stringify(result.data, null, 2))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.username ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="john_doe"
          />
          {errors.username?.map((error) => (
            <p key={error} className="text-xs text-red-500 mt-1">
              {error}
            </p>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={3}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.content ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="Type your message..."
          />
          <div className="flex justify-between items-center mt-1">
            {errors.content?.map((error) => (
              <p key={error} className="text-xs text-red-500">
                {error}
              </p>
            ))}
            <p
              className={`text-xs ml-auto ${
                content.length > 450 ? 'text-red-500' : 'text-gray-400'
              }`}
            >
              {content.length}/500
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Validate with Zod
        </button>
      </form>

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-700 font-medium mb-1">
            Validation passed:
          </p>
          <pre className="text-xs text-green-800 font-mono">{submitted}</pre>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Same Zod schema used client-side (form) and server-side (Server
        Actions).
      </p>
    </div>
  )
}
