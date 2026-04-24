import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ConversationWithLastMessage, MessageWithSender } from './types'

interface ChatState {
  activeConversationId: string | null
  conversations: ConversationWithLastMessage[]
  liveMessages: Record<string, MessageWithSender[]>
  wsStatus: 'connecting' | 'connected' | 'disconnected' | 'error'

  setActiveConversation: (id: string | null) => void
  setConversations: (convs: ConversationWithLastMessage[]) => void
  addLiveMessage: (conversationId: string, message: MessageWithSender) => void
  clearLiveMessages: (conversationId: string) => void
  setWsStatus: (status: ChatState['wsStatus']) => void
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set) => ({
      activeConversationId: null,
      conversations: [],
      liveMessages: {},
      wsStatus: 'disconnected',

      setActiveConversation: (id) =>
        set({ activeConversationId: id }, false, 'setActiveConversation'),
      setConversations: (convs) =>
        set({ conversations: convs }, false, 'setConversations'),
      addLiveMessage: (conversationId, message) =>
        set(
          (state) => ({
            liveMessages: {
              ...state.liveMessages,
              [conversationId]: [...(state.liveMessages[conversationId] ?? []), message],
            },
          }),
          false,
          'addLiveMessage'
        ),
      clearLiveMessages: (conversationId) =>
        set(
          (state) => ({
            liveMessages: { ...state.liveMessages, [conversationId]: [] },
          }),
          false,
          'clearLiveMessages'
        ),
      setWsStatus: (status) => set({ wsStatus: status }, false, 'setWsStatus'),
    }),
    { name: 'ChatStore' }
  )
)
