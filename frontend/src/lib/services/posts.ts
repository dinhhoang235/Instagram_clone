import api from "@/lib/api"
import { PostType } from "@/types/post"

interface PostsResponse {
  count: number
  next: string | null
  previous: string | null
  results: PostType[]
}

// get a post by ID
export const getPostById = async (id: string | number): Promise<PostType> => {
  const res = await api.get<PostType>(`/posts/${id}/`)
  return res.data
}

// get all posts by the following users with pagination
export const getPosts = async (page: number = 1): Promise<PostsResponse> => {
  const res = await api.get<PostsResponse>(`/posts/feed/?page=${page}`)
  return res.data
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

// Save/unsave (bookmark) a post
export const savePost = async (id: string): Promise<{ status: string; is_saved: boolean }> => {
  const res = await api.post<{ status: string; is_saved: boolean }>(`/posts/${id}/save/`)
  return res.data
}

import type { AxiosRequestConfig } from 'axios'

// create a new post
export const createPost = async (formData: FormData, config?: AxiosRequestConfig) => {
  const res = await api.post("/posts/", formData, { headers: { 'Content-Type': 'multipart/form-data' }, ...(config || {}) })
  return res.data
} 

// update a post (partial)
export const updatePost = async (id: string | number, data: FormData | Record<string, unknown>) => {
  if (data instanceof FormData) {
    const res = await api.patch(`/posts/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
    return res.data
  } else {
    const res = await api.patch(`/posts/${id}/`, data)
    return res.data
  }
}

// get popular places
export const getPopularPlaces = async (): Promise<{ location: string; postCount: number }[]> => {
  const res = await api.get<{ location: string; postCount: number }[]>("/posts/places/popular/")
  return res.data
}

// delete a post
export const deletePost = async (id: string | number) => {
  const res = await api.delete(`/posts/${id}/`)
  return res.data
}