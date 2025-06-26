export interface SearchUser {
  id: string
  username: string
  name: string
  avatar: string
  is_verified: boolean
  is_following: boolean
}

export interface SearchTag {
  id: string
  name: string
  postCount: string
}

export interface SearchPlace {
  id: string
  name: string
  postCount: string
}

export interface RecentSearch {
  id: number
  username: string
  name: string
  avatar: string
}

export interface SearchResponse {
  users: SearchUser[]
  tags: SearchTag[]
  places: SearchPlace[]
  recent_searches: RecentSearch[]
}
