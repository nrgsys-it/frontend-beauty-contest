'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { z } from 'zod'

// ─── Zod schema ───────────────────────────────────────────────────────────────
const ProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters'),
  email: z
    .string()
    .email('Please enter a valid email address'),
  bio: z
    .string()
    .max(200, 'Bio must be at most 200 characters')
    .optional(),
})

type ProfileData = z.infer<typeof ProfileSchema>
type FieldErrors = Partial<Record<keyof ProfileData, string>>

// ─── Component ───────────────────────────────────────────────────────────────
export function ProfileForm() {
  const [form, setForm] = useState<ProfileData>({ displayName: '', email: '', bio: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (field: keyof ProfileData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Validate single field inline as the user types
    const partial = ProfileSchema.pick({ [field]: true } as Record<keyof ProfileData, true>).safeParse({ [field]: value })
    setErrors((prev) => ({
      ...prev,
      [field]: partial.success ? undefined : partial.error.errors[0]?.message,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = ProfileSchema.safeParse(form)
    if (!result.success) {
      const mapped: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ProfileData
        if (!mapped[key]) mapped[key] = issue.message
      }
      setErrors(mapped)
      return
    }
    setErrors({})
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {/* Display name */}
      <Field
        id="displayName"
        label="Display name"
        value={form.displayName}
        onChange={(v) => handleChange('displayName', v)}
        error={errors.displayName}
        placeholder="Your name"
      />

      {/* Email */}
      <Field
        id="email"
        label="Email"
        type="email"
        value={form.email}
        onChange={(v) => handleChange('email', v)}
        error={errors.email}
        placeholder="you@example.com"
      />

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-text mb-1">
          Bio <span className="text-text-muted font-normal">(optional)</span>
        </label>
        <textarea
          id="bio"
          value={form.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          rows={3}
          maxLength={200}
          placeholder="A short description about yourself"
          className={`w-full px-3 py-2 border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 transition-colors resize-none ${
            errors.bio ? 'border-red-400 focus:ring-red-300' : 'border-border focus:ring-primary/50'
          }`}
        />
        <div className="flex justify-between mt-1">
          <FieldError error={errors.bio} />
          <span className="text-xs text-text-muted ml-auto">{(form.bio ?? '').length}/200</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          Save profile
        </button>

        <AnimatePresence>
          {submitted && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-emerald-600 font-medium"
            >
              ✓ Saved!
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </form>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Field({
  id, label, value, onChange, error, placeholder, type = 'text',
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full px-3 py-2 border rounded-lg bg-surface text-text text-sm focus:outline-none focus:ring-2 transition-colors ${
          error ? 'border-red-400 focus:ring-red-300' : 'border-border focus:ring-primary/50'
        }`}
      />
      <FieldError id={`${id}-error`} error={error} />
    </div>
  )
}

function FieldError({ error, id }: { error?: string; id?: string }) {
  return (
    <AnimatePresence mode="wait">
      {error ? (
        <motion.p
          key="err"
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="text-xs text-red-600 mt-1"
        >
          {error}
        </motion.p>
      ) : null}
    </AnimatePresence>
  )
}
