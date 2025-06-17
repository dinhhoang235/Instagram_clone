import api from "@/lib/api"
import type { ProfileType, UpdateProfileInput } from "@/types/profile"

export async function getMyProfile(): Promise<ProfileType> {
  const res = await api.get<ProfileType>("/profiles/me/")
  return res.data
}

export async function getUserProfile(username: string): Promise<ProfileType> {
  const res = await api.get<ProfileType>(`/profiles/${username}/`)
  return res.data
}

export async function updateMyProfile(data: UpdateProfileInput): Promise<ProfileType> {
  const res = await api.patch<ProfileType>("/profiles/me/", data)
  return res.data
}

export async function followUser(username: string): Promise<{ detail: string }> {
  const res = await api.post<{ detail: string }>(`/profiles/${username}/follow/`)
  return res.data
}

export async function unfollowUser(username: string): Promise<{ detail: string }> {
  const res = await api.post<{ detail: string }>(`/profiles/${username}/unfollow/`)
  return res.data
}

export async function getFollowers(username: string): Promise<ProfileType[]> {
  const res = await api.get<ProfileType[]>(`/profiles/${username}/followers/`)
  return res.data
}

export async function getFollowing(username: string): Promise<ProfileType[]> {
  const res = await api.get<ProfileType[]>(`/profiles/${username}/following/`)
  return res.data
}
