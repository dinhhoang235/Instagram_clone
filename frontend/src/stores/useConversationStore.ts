import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { MessageListType } from "@/types/chat"

// Payload type accepted by setConversations. Backend may return either an array
// of MessageListType or an object with a `conversations` array and optional errors.
// Use `unknown` for errors to avoid `any` while keeping flexibility.
type ConversationsPayload = MessageListType[] | { conversations: MessageListType[]; errors?: unknown[] }

type ConversationStore = {
  conversations: MessageListType[]
  setConversations: (convos: MessageListType[]) => void
  updateConversation: (incoming: {
    chat_id: number
    message: string
    timestamp: string
    sender: {
      username: string
      avatar: string | null
      id?: number // Add optional id field for the sender
    }
    is_sender: boolean
    unread_count?: number
  }) => void
  setPartnerOnline: (partnerId: number, online: boolean, lastActive?: string | null) => void
  markAsRead: (id: number) => void
  clearConversations: () => void
}

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set) => ({
      conversations: [],

      setConversations: (convos: ConversationsPayload) => {
        // Normalize possible response shapes: array, { conversations: [...] }, or unexpected
        if (Array.isArray(convos)) {
          set({ conversations: convos })
        } else if (convos && Array.isArray(convos.conversations)) {
          set({ conversations: convos.conversations })
        } else {
          console.warn('setConversations received unexpected payload, normalizing to empty array', convos)
          set({ conversations: [] })
        }
      },

  updateConversation: (incoming) =>
    set((state) => {
      console.log("Updating conversation with:", incoming)

      const chatId = typeof incoming.chat_id === 'string'
        ? parseInt(incoming.chat_id, 10)
        : incoming.chat_id

      const index = state.conversations.findIndex((c) => c.id === chatId)
      const updated = [...state.conversations]

      const formattedMessage = incoming.is_sender
        ? `You: ${incoming.message}`
        : incoming.message

      const unreadCount = incoming.unread_count ?? (incoming.is_sender ? 0 : 1)

      if (index !== -1) {
        const convo = updated[index]
        const updatedConvo = {
          ...convo,
          lastMessage: formattedMessage,
          time: incoming.timestamp,
          unread_count: unreadCount,
          online: convo.online,
          partner_id: convo.partner_id, // Preserve the partner_id
        }
        
        // Only move to top if there's a new unread message from the other person
        // If it's our message or if we're just updating for some other reason, keep it in place
        if (unreadCount > 0 && !incoming.is_sender) {
          // New unread message from other person - move to top
          updated.splice(index, 1)
          return { conversations: [updatedConvo, ...updated] }
        } else {
          // No new unread message, or it's our message - keep it in same position
          updated[index] = updatedConvo
          return { conversations: updated }
        }
      } else {
        // If sender information includes an id, use it as partner_id
        const sender_id = incoming.sender?.id || 0;

        const newConvo: MessageListType = {
          id: chatId,
          username: incoming.sender.username || "Unknown",
          avatar: incoming.sender.avatar ?? null,
          lastMessage: formattedMessage,
          time: incoming.timestamp,
          unread_count: unreadCount,
          online: false,
          partner_id: sender_id, // Include partner_id for new conversations
        }
        return { conversations: [newConvo, ...updated] }
      }
    }),

  setPartnerOnline: (partnerId, online, lastActive = null) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.partner_id === partnerId ? { ...c, online, last_active: lastActive ?? c.last_active } : c
      ),
    })),

  markAsRead: (id) =>
    set((state) => {
      console.log(`✓ Marking conversation ${id} as read in store`);
      // First check if this conversation exists in our state
      const conversationExists = state.conversations.some(c => c.id === id);
      
      if (!conversationExists) {
        console.log(`ℹ️ Conversation ${id} not found in store, skipping mark as read`);
        return { conversations: state.conversations }; // No change
      }
      
      return {
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, unread_count: 0 } : c
        ),
      };
    }),

      clearConversations: () => set({ conversations: [] }),
    }),
    {
      name: 'conversation-storage',
      partialize: (state) => ({ conversations: state.conversations }),
    }
  )
)
