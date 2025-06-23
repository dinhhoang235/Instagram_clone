export interface MessageType {
    id: number
    sender: string
    text: string
    time: string
    isOwn: boolean
}

export interface ChatProps {
    chatId: number
    username: string
    avatar: string
    online: boolean
}

export interface MessageListType {
    id: number
    username: string
    avatar: string | null 
    lastMessage: string
    time: string
    unread: boolean
    online?: boolean
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}