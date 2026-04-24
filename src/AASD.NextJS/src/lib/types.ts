import type { Message, User, Conversation } from '@prisma/client'

export type MessageWithSender = Message & {
  sender: Pick<User, 'id' | 'name' | 'surname'>
}

export type ConversationWithLastMessage = Conversation & {
  messages: (Message & { sender: Pick<User, 'name'> })[]
}

// WebSocket message types
export type WsMessageType =
  | { type: 'chat'; payload: { conversationId: string; message: MessageWithSender } }
  | { type: 'join'; payload: { conversationId: string; userId: string } }
  | { type: 'leave'; payload: { conversationId: string; userId: string } }
  | { type: 'ping' }
  | { type: 'pong' }
  | { type: 'error'; payload: { message: string } }
