import type { Metadata } from 'next'
import { getConversations } from '@/app/actions/messages'
import { getUsers } from '@/app/actions/conversations'
import WsDemo from '@/components/ws/WsDemo'
import { PageHeader } from '@/components/ui/PageHeader'

export const metadata: Metadata = { title: 'SignalR Demo' }

export default async function WsDemoPage() {
  const [conversations, users] = await Promise.all([getConversations(), getUsers()])

  const activeConversation = conversations[0] ?? null
  const senderId = activeConversation?.participants[0]?.id ?? users[0]?.id ?? null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        heading="WebSocket / SignalR Demo"
        description="This page demonstrates real-time communication using SignalR (@microsoft/signalr). Watch the connection lifecycle as you interact."
      />

      {activeConversation && senderId ? (
        <WsDemo
          conversationId={activeConversation.id}
          senderId={senderId}
          title={activeConversation.title}
        />
      ) : (
        <div className="rounded-xl border border-border bg-surface p-6 text-sm text-text-muted">
          A conversation and at least one user are required in backend seed data.
        </div>
      )}
    </div>
  )
}
