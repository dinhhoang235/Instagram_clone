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

export async function updateMyProfile(data: UpdateProfileInput | FormData): Promise<ProfileType> {
  const isFormData = data instanceof FormData;

  const res = await api.patch<ProfileType>("/profiles/me/", data, {
    headers: isFormData ? {} : { "Content-Type": "application/json" },
  });

  return res.data;
}

// Follow or unfollow a user
export async function toggleFollowUser(username: string): Promise<{ detail: string, is_following: boolean  }> {
  const res = await api.post<{ detail: string, is_following: boolean }>(`/profiles/${username}/toggle_follow/`)
  return res.data
}

// get list of followers 
export async function getFollowers(username: string): Promise<ProfileType[]> {
  const res = await api.get<ProfileType[]>(`/profiles/${username}/followers/`)
  return res.data
}

// get list of following
export async function getFollowing(username: string): Promise<ProfileType[]> {
  const res = await api.get<ProfileType[]>(`/profiles/${username}/following/`)
  return res.data
}
