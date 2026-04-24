import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getConversations } from '@/app/actions/messages'
import ChatLayout from '@/components/chat/ChatLayout'
import ConversationListSkeleton from '@/components/chat/ConversationListSkeleton'

export const metadata: Metadata = { title: 'Chat' }

// This is a React Server Component - data fetched on the server
export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }>
}) {
  const { conv } = await searchParams
  const conversations = await getConversations()

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      <Suspense fallback={<ConversationListSkeleton />}>
        <ChatLayout
          conversations={conversations}
          activeConversationId={conv ?? null}
        />
      </Suspense>
    </div>
  )
}
