export interface MessageType {
    id: number
    sender: string
    sender_id?: number  // Add sender_id field
    text: string
    time: string
    isOwn: boolean
    readByIds?: number[]
}

export interface ChatProps {
  chatId: number
  username: string
  avatar: string
  online: boolean
  currentUserId: number
  partnerId: number
}

export interface MessageListType {
    id: number
    username: string
    avatar: string | null 
    lastMessage: string
    time: string
    online?: boolean
    unread_count: number
    partner_id?: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface MarkReadResponse {
  status: string
  marked_read: number
  thread_id: number
  user_id: number
  username: string
}

export interface SendFirstMessageResponse {
  thread_id: number
  message_id: number
  partner: {
    id: number
    username: string
    avatar: string
  }
}
