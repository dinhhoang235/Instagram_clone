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
    }
    is_sender: boolean
  }) => void
  markAsRead: (id: number) => void
  clearConversations: () => void
}

export const useConversationStore = create<ConversationStore>((set) => ({
  conversations: [],

  setConversations: (convos) => set({ conversations: convos }),

  updateConversation: (incoming) =>
    set((state) => {
      console.log("Updating conversation with:", incoming);
      
      // Convert chat_id to number if it's a string
      const chatId = typeof incoming.chat_id === 'string' 
        ? parseInt(incoming.chat_id, 10) 
        : incoming.chat_id;
      
      const index = state.conversations.findIndex((c) => c.id === chatId);
      const updated = [...state.conversations];

      const formattedMessage = incoming.is_sender 
        ? `You: ${incoming.message}`
        : incoming.message;

      if (index !== -1) {
        // Update existing conversation
        const convo = updated[index];
        const updatedConvo = {
          ...convo,
          lastMessage: formattedMessage,
          time: incoming.timestamp,
          unread: !incoming.is_sender,
          // Preserve online status
          online: convo.online,
        };
        // Remove it from its current position
        updated.splice(index, 1);
        // Add it to the beginning of the array (most recent)
        return { conversations: [updatedConvo, ...updated] };
      } else {
        // Create a new conversation entry if it doesn't exist
        const newConvo: MessageListType = {
          id: chatId,
          username: incoming.sender.username || "Unknown",
          avatar: incoming.sender.avatar ?? null,
          lastMessage: formattedMessage,
          time: incoming.timestamp,
          unread: !incoming.is_sender,
          online: false,
        };
        return { conversations: [newConvo, ...updated] };
      }
    }),

  markAsRead: (id) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, unread: false } : c
      ),
    })),

  clearConversations: () => set({ conversations: [] }),
}))
