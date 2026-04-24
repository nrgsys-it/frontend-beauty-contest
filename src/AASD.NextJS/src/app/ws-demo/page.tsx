import type { Metadata } from 'next'
import { getConversations, getUsers } from '@/app/actions/messages'
import WsDemo from '@/components/ws/WsDemo'

export const metadata: Metadata = { title: 'SignalR Demo' }

export default async function WsDemoPage() {
  const [conversations, users] = await Promise.all([getConversations(), getUsers()])

  const activeConversation = conversations[0] ?? null
  const senderId = activeConversation?.participants[0]?.id ?? users[0]?.id ?? null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SignalR Demo</h1>
        <p className="text-gray-500">
          This page uses the shared backend API and SignalR hub. Open two tabs to verify real-time message fanout.
        </p>
      </div>

      {activeConversation && senderId ? (
        <WsDemo
          conversationId={activeConversation.id}
          senderId={senderId}
          title={activeConversation.title}
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          A conversation and at least one user are required in backend seed data.
        </div>
      )}
    </div>
  )
}
