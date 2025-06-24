import api from "@/lib/api";
import { MessageType, MessageListType, PaginatedResponse } from "@/types/chat";
import type { MarkReadResponse } from "@/types/chat";


// Lấy danh sách cuộc trò chuyện
export async function getConversations(): Promise<MessageListType[]> {
    const res = await api.get<MessageListType[]>("/chats/conversations/")
    return res.data
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
    console.log("Connecting to WebSocket:", url);

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
  console.log("Connecting to Conversations WebSocket:", url);
  
  const socket = new WebSocket(url);

  socket.onopen = () => console.log("Connected to Conversations WebSocket");
  socket.onerror = (err) => {
    console.error("WebSocket error:", err);
    // You could implement reconnection logic here if needed
  };
  socket.onclose = (event) => {
    console.log("Conversations WebSocket closed:", event.code, event.reason);
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