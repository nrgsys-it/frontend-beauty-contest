// RSC — no "use client"

interface EvalSectionProps {
  id: string
  title: string
  badge: string
  badgeColor: 'green' | 'blue' | 'purple' | 'orange'
  description: string
  children: React.ReactNode
}

const BADGE_STYLES: Record<EvalSectionProps['badgeColor'], string> = {
  green:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  blue: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  purple:
    'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  orange:
    'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
}

const BADGE_DOT: Record<EvalSectionProps['badgeColor'], string> = {
  green: 'bg-emerald-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
}

export function EvalSection({
  id,
  title,
  badge,
  badgeColor,
  description,
  children,
}: EvalSectionProps) {
  return (
    <section id={id} className="border border-border rounded-2xl overflow-hidden">
      {/* Section header */}
      <div className="bg-surface-2 px-6 py-4 space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-text">{title}</h2>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${BADGE_STYLES[badgeColor]}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${BADGE_DOT[badgeColor]}`} />
            {badge}
          </span>
        </div>
        <p className="text-sm text-text-muted">{description}</p>
      </div>

      {/* Section body */}
      <div className="px-6 py-6 space-y-4 bg-surface">{children}</div>
    </section>
  )
}
