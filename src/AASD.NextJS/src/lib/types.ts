export interface UserSummary {
  id: string
  name: string
  surname: string
  email: string
  createdAt: string
}

export interface ConversationParticipant {
  id: string
  name: string
  surname: string
  email: string
}

export interface MessageWithSender {
  id: string
  content: string
  senderId: string
  conversationId: string
  createdAt: string
  sender: Pick<ConversationParticipant, 'id' | 'name' | 'surname' | 'email'>
}

export interface ConversationWithLastMessage {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  participants: ConversationParticipant[]
  messages: MessageWithSender[]
}

export type RealtimeStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

// Real-time message envelope used by the SignalR hook
export type WsMessageType =
  | { type: 'chat'; payload: { conversationId: string; message: MessageWithSender } }
