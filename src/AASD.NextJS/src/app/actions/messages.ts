'use server'

import {
  backendRequest,
  getConversationsFromBackend,
  getMessagesFromBackend,
} from '@/lib/backend'
import type { MessageWithSender } from '@/lib/types'
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

