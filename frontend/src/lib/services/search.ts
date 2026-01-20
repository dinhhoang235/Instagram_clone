import api from '@/lib/api'
import type { SearchResponse, MinimalUser } from "@/types/search"

export const searchAll = async (query: string): Promise<SearchResponse> => {
    const res = await api.get<SearchResponse>("/search/", {
        params: { q: query }
    })
    return res.data
}

// add a recent search for a user
export const addRecentSearch = async (userId: number) => {
  await api.post("/search/recent/add/", { user_id: userId })
}

// delete all recent searches
export const clearAllRecentSearches = async (): Promise<void> => {
  await api.delete("/search/recent/clear/")
}
// delete a specific recent search by user ID
export const deleteRecentSearch = async (userId: number): Promise<void> => {
  await api.delete(`/search/recent/${userId}/delete/`)
}

// search for users by username
export const searchUsers = async (query: string, mutualOnly: boolean = false): Promise<MinimalUser[]> => {
  const res = await api.get<MinimalUser[]>("/search/users/", {
    params: { 
      q: query,
      mutual: mutualOnly ? "true" : "false"
    }
  })
  return res.data
}