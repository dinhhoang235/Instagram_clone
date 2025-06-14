export interface UserType {
  username: string
  avatar: string
  is_verified: boolean
}

export interface ReplyType {
  id: number
  user: UserType
  text: string
  likes: number
  is_liked: boolean
  timeAgo: string
}

export interface CommentType {
    id: number;
    user: UserType;
    text: string;
    likes: number;
    is_liked: boolean;
    timeAgo: string;
    replies: ReplyType[]
}