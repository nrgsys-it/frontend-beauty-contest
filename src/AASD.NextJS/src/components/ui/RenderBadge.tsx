// Server variant (NO "use client" - this is an RSC)
// Renders a green badge stamped with the server render time.

interface ServerBadgeProps {
  label?: string
}

export function ServerRenderBadge({ label = 'Server Component · SSR' }: ServerBadgeProps) {
  const renderTime = new Date().toISOString()
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
      title={`Rendered on server at ${renderTime}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
      {label}
      <span className="text-emerald-600 dark:text-emerald-500 font-mono text-[10px] ml-1">
        {renderTime.slice(11, 23)}
      </span>
    </span>
  )
}
