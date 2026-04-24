'use server'

import {
  backendRequest,
  getConversationsFromBackend,
  getMessagesFromBackend,
  getUsersFromBackend,
} from '@/lib/backend'
import type {
  ConversationWithLastMessage,
  MessageWithSender,
  UserSummary,
} from '@/lib/types'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const SendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
})

export async function sendMessage(data: z.infer<typeof SendMessageSchema>) {
  const parsed = SendMessageSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { content, conversationId, senderId } = parsed.data

  try {
    const message = await backendRequest<MessageWithSender>(
      `/api/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content, senderId }),
      },
    )

    revalidatePath('/chat')
    return { message }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Unable to send the message right now.',
    }
  }
}

export async function getMessages(conversationId: string) {
  return getMessagesFromBackend(conversationId)
}

export async function getConversations() {
  return getConversationsFromBackend()
}

export async function getUsers() {
  return getUsersFromBackend()
}

type CreateConversationResult =
  | { conversation: ConversationWithLastMessage }
  | { error: string }

export async function createConversation(
  title: string,
  participantIds?: string[],
): Promise<CreateConversationResult> {
  const parsed = z.string().min(1).max(100).safeParse(title)
  if (!parsed.success) return { error: 'Invalid title' }

  const participantCandidates = participantIds && participantIds.length > 0
    ? participantIds
    : (await getUsersFromBackend()).map((user: UserSummary) => user.id).slice(0, 2)

  if (participantCandidates.length === 0) {
    return { error: 'No participants available to create a conversation.' }
  }

  try {
    await backendRequest<{ id: string }>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({
        title: parsed.data,
        participantIds: participantCandidates,
      }),
    })

    const conversations = await getConversationsFromBackend()
    const created = conversations.find((conversation) => conversation.title === parsed.data)

    if (!created) {
      return { error: 'Conversation was created but could not be reloaded.' }
    }

    revalidatePath('/chat')
    return { conversation: created }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Unable to create conversation right now.',
    }
  }
}
