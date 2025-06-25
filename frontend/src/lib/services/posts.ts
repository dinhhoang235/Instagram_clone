import api from "@/lib/api"
import { PostType } from "@/types/post"

// get a post by ID
export const getPostById = async (id: string | number): Promise<PostType> => {
  const res = await api.get<PostType>(`/posts/${id}/`)
  return res.data
}

// get all posts by the following users 
export const getPosts = async (): Promise<PostType[]> => {
  const res = await api.get<{ results: PostType[] }>("/posts/feed/")
  return res.data.results
}

// get all posts for explore page
export const getPostsExplore = async (): Promise<PostType[]> => {
  const res = await api.get<{ results: PostType[] }>("/posts/explore/")
  return res.data.results
}

// get posts by a specific user
export const getPostsByUsername = async (username: string): Promise<PostType[]> => {
  const res = await api.get<{ results: PostType[] }>(`/posts/?user=${username}`)
  return res.data.results
}

// Like and unlike a post
export const likePost = async (id: string): Promise<{ message: string }> => {
  const res = await api.post<{ message: string }>(`/posts/${id}/like/`)
  return res.data
}

// create a new post
export const createPost = async (formData: FormData) => {
  const res = await api.post("/posts/", formData)
  return res.data
}

// get popular places
export const getPopularPlaces = async (): Promise<{ location: string; postCount: number }[]> => {
  const res = await api.get<{ location: string; postCount: number }[]>("/posts/places/popular/")
  return res.data
}