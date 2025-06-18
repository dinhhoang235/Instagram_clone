export interface NotificationType {
    id: number
    type: "like" | "follow" | "comment" | "mention"
    user: {
      username: string
      avatar: string
    }
    content: string
    time: string
    postImage?: string
  
}
