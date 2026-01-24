import api from "@/lib/api";
import type { SendFileMessageResponse, DeleteThreadResponse } from "@/types/chat";

// Chats-related backend calls

// Delete a thread (conversation)
export async function deleteThread(threadId: number): Promise<DeleteThreadResponse> {
  try {
    const res = await api.delete<DeleteThreadResponse>(`/chats/threads/${threadId}/`)
    return res.data
  } catch (error) {
    console.error(`Failed to delete thread ${threadId}:`, error)
    throw error
  }
}

// Send a message with image or file attached
export async function sendMessageWithFile(threadId: number, formData: FormData): Promise<SendFileMessageResponse> {
  try {
    const res = await api.post<SendFileMessageResponse>(
      `/chats/threads/${threadId}/send-file/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return res.data
  } catch (error) {
    console.error(`Failed to send file message for thread ${threadId}:`, error)
    throw error
  }
} 
