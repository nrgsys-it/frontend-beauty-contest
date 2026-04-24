import { prisma } from '@/lib/prisma'

export default async function ConversationStats() {
  // Direct DB access in RSC - no API layer needed
  const conversations = await prisma.conversation.findMany({
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { messages: true } } },
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-4">Recent Conversations</h3>
      {conversations.length === 0 ? (
        <p className="text-sm text-gray-400">No conversations yet</p>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => (
            <li key={c.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 truncate">{c.title}</span>
              <span className="text-gray-400 ml-2 flex-shrink-0">{c._count.messages} msgs</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-400 mt-4 pt-3 border-t">
        ⚡ Fetched server-side via Prisma - no REST API
      </p>
    </div>
  )
}
