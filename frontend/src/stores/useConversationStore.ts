import { create } from "zustand"
import type { MessageListType } from "@/types/chat"

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
  markAsRead: (id: number) => void
  clearConversations: () => void
}

export const useConversationStore = create<ConversationStore>((set) => ({
  conversations: [],

  setConversations: (convos) => set({ conversations: convos }),

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
        updated.splice(index, 1)
        return { conversations: [updatedConvo, ...updated] }
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

  markAsRead: (id) =>
    set((state) => {
      console.log(`✓ Marking conversation ${id} as read in store`);
      // First check if this conversation exists in our state
      const conversationExists = state.conversations.some(c => c.id === id);
      
      if (!conversationExists) {
        console.warn(`⚠️ Cannot mark conversation ${id} as read - not found in store`);
        return { conversations: state.conversations }; // No change
      }
      
      return {
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, unread_count: 0 } : c
        ),
      };
    }),

  clearConversations: () => set({ conversations: [] }),
}))
