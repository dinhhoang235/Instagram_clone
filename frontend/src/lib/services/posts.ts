import api from "@/lib/api"
import { PostType } from "@/types/post"


export const getPostById = async (id: string | number): Promise<PostType> => {
  const res = await api.get<PostType>(`/posts/${id}/`)
  return res.data
}

export const getPosts = async (): Promise<PostType[]> => {
  const res = await api.get<{ results: PostType[] }>("/posts/")
  return res.data.results
}

// Like and unlike a post
export const likePost = async (id: string): Promise<{ message: string }> => {
  const res = await api.post<{ message: string }>(`/posts/${id}/like/`)
  return res.data
}

