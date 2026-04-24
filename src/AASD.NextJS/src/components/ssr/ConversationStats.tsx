import { getConversationsFromBackend, getMessagesFromBackend } from '@/lib/backend'
import { ServerRenderBadge } from '@/components/ui/RenderBadge'

export default async function ConversationStats() {
  const conversations = (await getConversationsFromBackend()).slice(0, 5)
  const messageCounts = await Promise.all(
    conversations.map((conversation) =>
      getMessagesFromBackend(conversation.id).then((messages) => messages.length),
    ),
  )

  return (
    <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text">Recent Conversations</h3>
        <ServerRenderBadge />
      </div>
      {conversations.length === 0 ? (
        <p className="text-sm text-text-muted">No conversations yet</p>
      ) : (
        <ul className="space-y-2">
          {conversations.map((conversation, index) => (
            <li key={conversation.id} className="flex items-center justify-between text-sm">
              <span className="text-text truncate">{conversation.title}</span>
              <span className="text-text-muted ml-2 flex-shrink-0">{messageCounts[index] ?? 0} msgs</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-text-muted mt-4 pt-3 border-t border-border">
        ⚡ Fetched server-side via REST calls to shared backend
      </p>
    </div>
  )
}
