import api from "@/lib/api";
import { MessageType, MessageListType, PaginatedResponse } from "@/types/chat";
import type { MarkReadResponse, SendFirstMessageResponse } from "@/types/chat";

type ConversationsResponse = MessageListType[] | { conversations: MessageListType[]; errors?: unknown[] }

// Lấy danh sách cuộc trò chuyện
export async function getConversations(): Promise<MessageListType[]> {
    const res = await api.get<ConversationsResponse>("/chats/conversations/")
    // Backend may return either an array or an object { conversations: [...], errors: [...] }
    if (res.data && Array.isArray(res.data)) {
        return res.data as MessageListType[]
    }
    if (res.data && Array.isArray(res.data.conversations)) {
        // Log any partial errors for debugging in dev
        if (res.data.errors && res.data.errors.length && process.env.NODE_ENV === 'development') {
            console.warn('Partial conversation errors:', res.data.errors)
        }
        return res.data.conversations as MessageListType[]
    }

    // Fallback - return empty array to avoid runtime errors
    console.warn('Unexpected conversations response shape:', res.data)
    return []
}

// Create a new conversation with a user
export async function createConversation(userId: number): Promise<{ thread_id: number }> {
    const res = await api.post<{ thread_id: number }>("/chats/conversations/", { user_id: userId })
    return res.data
}

// Lấy tin nhắn trong một cuộc trò chuyện
export async function getMessages(threadId: number, offset = 0): Promise<PaginatedResponse<MessageType>> {
    const res = await api.get<PaginatedResponse<MessageType>>(`/chats/threads/${threadId}/messages/?offset=${offset}`)
    return res.data
}
export function createChatSocket(chatId: number): WebSocket {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;

    let token = '';
    try {
        token = localStorage.getItem("access_token") || "";
    } catch (error) {
        console.error("Failed to get token:", error);
    }

    // Properly URL encode the token to handle special characters
    const encodedToken = encodeURIComponent(token);
    const url = `${protocol}://${host}/ws/chat/${chatId}/?token=${encodedToken}`;

    const socket = new WebSocket(url);

    socket.onopen = () => console.log("WebSocket connected");
    socket.onerror = (err) => console.error("WebSocket error:", err);
    socket.onclose = (event) => {
        console.log("Chat WebSocket closed:", event.code, event.reason);
        // Reconnect after a brief delay if connection was closed unexpectedly
        if (event.code !== 1000) {
            console.log("Attempting to reconnect chat in 3 seconds...");
            setTimeout(() => {
                console.log("Reconnecting to chat WebSocket...");
                // Return value is not used here since reconnection is handled internally
                createChatSocket(chatId);
            }, 3000);
        }
    };

    return socket;
}

export function createConversationsSocket(): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;

  let token = '';
  try {
    token = localStorage.getItem("access_token") || "";
  } catch (error) {
    console.error("Failed to get token:", error);
  }

  // Properly URL encode the token to handle special characters
  const encodedToken = encodeURIComponent(token);
  const url = `${protocol}://${host}/ws/conversations/?token=${encodedToken}`;
  
  const socket = new WebSocket(url);

  socket.onopen = () => console.log("Connected to Conversations WebSocket");
  socket.onerror = (err) => {
    console.error("WebSocket error:", err);
  };
  socket.onclose = (event) => {
    console.warn("Conversations WebSocket closed:", event.code, event.reason, 'wasClean:', event.wasClean);
    // Reconnect after a brief delay if connection was closed unexpectedly
    if (event.code !== 1000) {
      console.log("Attempting to reconnect in 3 seconds...");
      setTimeout(() => {
        console.log("Reconnecting to WebSocket...");
        // Return value not used here since we're just reconnecting automatically
        createConversationsSocket();
      }, 3000);
    }
  };

  return socket;
}


export async function markConversationAsRead(threadId: number): Promise<MarkReadResponse> {
  try {
    const response = await api.post<MarkReadResponse>(`/chats/threads/${threadId}/mark-read/`);
    console.log(`✅ API call to mark thread ${threadId} as read successful:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Failed to mark thread ${threadId} as read:`, error);
    throw error; // Rethrow so callers can handle the error
  }
}

export async function sendFirstMessage(userId: number, text: string): Promise<SendFirstMessageResponse> {
  const res = await api.post<SendFirstMessageResponse>("/chats/start/", {
    user_id: userId,
    text: text,
  })
  return res.data
}