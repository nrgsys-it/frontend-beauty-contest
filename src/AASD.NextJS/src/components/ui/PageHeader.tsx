'use client'

import { useTranslations } from 'next-intl'

interface PageHeaderProps {
  namespace: string
  headingKey?: string
  descriptionKey?: string
}

export function PageHeader({
  namespace,
  headingKey = 'heading',
  descriptionKey = 'description',
}: PageHeaderProps) {
  const t = useTranslations(namespace)
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-text mb-2">{t(headingKey)}</h1>
      <p className="text-text-muted">{t(descriptionKey)}</p>
    </div>
  )
}
