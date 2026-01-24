export interface PostType {
  id: string 
  user: {
    username: string
    avatar: string
    isVerified: boolean
  }
  image: string
  caption: string
  hashtags?: string[]
  likes: number
  is_liked: boolean
  is_saved?: boolean
  comments: number
  timeAgo: string
  location?: string
}
