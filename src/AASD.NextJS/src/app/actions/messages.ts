'use server'

import { prisma } from '@/lib/prisma'
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

  const message = await prisma.message.create({
    data: { content, conversationId, senderId },
    include: { sender: { select: { id: true, name: true, surname: true } } },
  })

  // Increment message sequence
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { message_sequence: { increment: 1 } },
  })

  revalidatePath(`/chat`)
  return { message }
}

export async function getMessages(conversationId: string) {
  return prisma.message.findMany({
    where: { conversationId },
    include: { sender: { select: { id: true, name: true, surname: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })
}

export async function getConversations() {
  return prisma.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: { select: { name: true } } },
      },
    },
  })
}

export async function createConversation(title: string) {
  const parsed = z.string().min(1).max(100).safeParse(title)
  if (!parsed.success) return { error: 'Invalid title' }

  const conversation = await prisma.conversation.create({
    data: { title: parsed.data },
  })
  revalidatePath('/chat')
  return { conversation }
}
