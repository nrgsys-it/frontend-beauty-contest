// RSC — no "use client"
import type { UserSummary, ConversationWithLastMessage } from '@/lib/types'

interface ServerDataCardProps {
  users: UserSummary[]
  conversations: ConversationWithLastMessage[]
  renderTime: string
}

export function ServerDataCard({ users, conversations, renderTime }: ServerDataCardProps) {
  // Format HH:MM:SS from ISO string
  const timeLabel = renderTime.slice(11, 19)

  return (
    <div className="space-y-3">
      {/* Server badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        ⚡ Rendered on Server at {timeLabel}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-2 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-text">{users.length}</div>
          <div className="text-xs text-text-muted mt-1 font-medium">Users</div>
          <div className="text-[10px] text-text-muted mt-0.5">fetched server-side</div>
        </div>
        <div className="bg-surface-2 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-text">{conversations.length}</div>
          <div className="text-xs text-text-muted mt-1 font-medium">Conversations</div>
          <div className="text-[10px] text-text-muted mt-0.5">fetched server-side</div>
        </div>
        <div className="bg-surface-2 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-text font-mono">{timeLabel}</div>
          <div className="text-xs text-text-muted mt-1 font-medium">Render time</div>
          <div className="text-[10px] text-text-muted mt-0.5">frozen — never changes</div>
        </div>
      </div>

      <p className="text-xs text-text-muted">
        These values were computed on the server before the HTML was sent to the browser.
        The render timestamp is frozen — it will not change on refresh unless the server re-renders.
      </p>
    </div>
  )
}
