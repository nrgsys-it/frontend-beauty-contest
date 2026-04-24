import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ConversationWithLastMessage, MessageWithSender, RealtimeStatus, RealtimeStatusEntry } from './types'

interface ChatState {
  activeConversationId: string | null
  conversations: ConversationWithLastMessage[]
  liveMessages: Record<string, MessageWithSender[]>
  wsStatus: RealtimeStatus
  wsStatusHistory: RealtimeStatusEntry[]

  // Phase 2: which participant the user is currently "writing as"
  activeSenderId: string | null

  // Phase 3: unread message counts per conversation (incremented by SignalR for non-active convs)
  unreadCounts: Record<string, number>

  setActiveConversation: (id: string | null) => void
  setConversations: (convs: ConversationWithLastMessage[]) => void
  addLiveMessage: (conversationId: string, message: MessageWithSender) => void
  clearLiveMessages: (conversationId: string) => void
  setWsStatus: (status: RealtimeStatus) => void
  setWsStatusHistory: (history: RealtimeStatusEntry[]) => void
  setActiveSenderId: (id: string) => void
  incrementUnread: (conversationId: string) => void
  clearUnread: (conversationId: string) => void
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set) => ({
      activeConversationId: null,
      conversations: [],
      liveMessages: {},
      wsStatus: 'disconnected',
      wsStatusHistory: [],
      activeSenderId: null,
      unreadCounts: {},

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
      setWsStatusHistory: (history) => set({ wsStatusHistory: history }, false, 'setWsStatusHistory'),
      setActiveSenderId: (id) => set({ activeSenderId: id }, false, 'setActiveSenderId'),
      incrementUnread: (conversationId) =>
        set(
          (state) => ({
            unreadCounts: {
              ...state.unreadCounts,
              [conversationId]: (state.unreadCounts[conversationId] ?? 0) + 1,
            },
          }),
          false,
          'incrementUnread'
        ),
      clearUnread: (conversationId) =>
        set(
          (state) => ({
            unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
          }),
          false,
          'clearUnread'
        ),
    }),
    { name: 'ChatStore' }
  )
)
