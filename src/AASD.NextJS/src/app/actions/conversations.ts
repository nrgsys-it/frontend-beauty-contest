'use server'

import {
  backendRequest,
  getConversationsFromBackend,
  getUsersFromBackend,
} from '@/lib/backend'
import type { ConversationWithLastMessage, UserSummary } from '@/lib/types'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

export async function getUsers() {
  return getUsersFromBackend()
}

export async function getConversation(id: string): Promise<ConversationWithLastMessage | null> {
  try {
    const conversations = await getConversationsFromBackend()
    return conversations.find((c) => c.id === id) ?? null
  } catch {
    return null
  }
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
