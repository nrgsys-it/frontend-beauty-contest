import { getUsersFromBackend } from '@/lib/backend'
import { ServerRenderBadge } from '@/components/ui/RenderBadge'

export default async function UserList() {
  const users = (await getUsersFromBackend()).slice(0, 5)

  return (
    <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text">Recent Users</h3>
        <ServerRenderBadge />
      </div>
      {users.length === 0 ? (
        <p className="text-sm text-text-muted">No users yet</p>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-medium text-xs flex-shrink-0">
                {u.name[0]}{u.surname[0]}
              </div>
              <div>
                <div className="text-text font-medium">{u.name} {u.surname}</div>
                <div className="text-text-muted text-xs">{u.email}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-text-muted mt-4 pt-3 border-t border-border">
        ⚡ Fetched server-side from shared backend API
      </p>
    </div>
  )
}
