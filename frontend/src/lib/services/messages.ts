import api from "@/lib/api";
import { MessageType, MessageListType, PaginatedResponse } from "@/types/chat";

// Lấy danh sách cuộc trò chuyện
export async function getConversations(): Promise<MessageListType[]> {
    const res = await api.get<MessageListType[]>("/chats/conversations/")
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

    const url = `${protocol}://${host}/ws/chat/${chatId}${token ? `/?token=${token}` : ''}`;
    console.log("Connecting to WebSocket:", url);

    const socket = new WebSocket(url);

    socket.onopen = () => console.log("WebSocket connected");
    socket.onerror = (err) => console.error("WebSocket error:", err);

    return socket;
}