import { getConversationsFromBackend, getMessagesFromBackend } from '@/lib/backend'

export default async function ConversationStats() {
  const conversations = (await getConversationsFromBackend()).slice(0, 5)
  const messageCounts = await Promise.all(
    conversations.map((conversation) =>
      getMessagesFromBackend(conversation.id).then((messages) => messages.length),
    ),
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-4">Recent Conversations</h3>
      {conversations.length === 0 ? (
        <p className="text-sm text-gray-400">No conversations yet</p>
      ) : (
        <ul className="space-y-2">
          {conversations.map((conversation, index) => (
            <li key={conversation.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 truncate">{conversation.title}</span>
              <span className="text-gray-400 ml-2 flex-shrink-0">{messageCounts[index] ?? 0} msgs</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-400 mt-4 pt-3 border-t">
        ⚡ Fetched server-side via REST calls to shared backend
      </p>
    </div>
  )
}
