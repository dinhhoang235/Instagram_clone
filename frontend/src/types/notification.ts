export interface NotificationType {
  id: number
  type: "like" | "follow" | "comment" | "mention"
  user: {
    username: string
    avatar: string
    is_following?: boolean // Add optional field to track if current user follows this user
  }
  content: string
  time: string
  postImage?: string
  is_read: boolean
  link: string
}
