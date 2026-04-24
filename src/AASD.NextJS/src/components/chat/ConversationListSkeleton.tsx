export default function ConversationListSkeleton() {
  return (
    <div className="w-72 border-r border-border p-4 space-y-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-surface-2 rounded w-3/4" />
          <div className="h-3 bg-surface-2 rounded w-full" />
        </div>
      ))}
    </div>
  )
}
